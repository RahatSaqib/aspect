const _ = require('lodash')
const { consumeInventoryForResult } = require('../inventory/consumeInventoryForResult')

// ----------------------------------------------------------
async function getResult(knex, resultId) {
  const row = await knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('ResultSource as rsc', 'r.resultSourceId', 'rsc.id')
    .where('r.id', resultId)
    .first(
      'r.externalId as resultExternalId',
      'r.resultData',
      'r.resultDataHash',
      'r.formData',
      'r.patientData',
      'r.oemData',
      'r.startedOn',
      'r.endedOn',
      'r.updatedOn',
      'r.researchId',
      'r.notes',
      'r.senderVersion',
      'r.senderOperator',
      'r.errorCode',
      'r.errorNotes',
      'r.consumableSerial',
      'r.consumableExpirationDate',
      'r.consumableLot',
      'r.instrumentSerial',
      'r.moduleName',
      'r.moduleSerial',
      'r.id as resultId',
      'r.sampleGroup',
      'a.externalId as assayId',
      'r.assayVersion',
      'r.rawData',
      'r.latitude',
      'r.longitude',
      'rt.externalId as resultTypeId',
      'rsc.externalId as resultSourceId',
      'r.sampleRunNumber',
      's.externalId as sampleId',
      's.collectedOn as sampleCollectedOn',
      'sos.externalId as sampleOriginSiteId',
      'st.externalId as sampleTypeId',
      'rc1.externalId as category1Id',
      'rc2.externalId as category2Id'
    )

  if (row == null) {
    // TODO when is this null??
    return null
  }

  const result = { formData: null }

  if (row.resultExternalId != null) {
    result.id = row.resultExternalId
  }

  result.assay = { id: row.assayId }
  if (row.assayVersion != null) {
    result.assay.version = row.assayVersion
  }

  const location = { latitude: row.latitude, longitude: row.longitude }
  if (location.latitude != null || location.longitude != null) {
    result.location = location
  }
  result.type = { id: row.resultTypeId }
  result.source = { id: row.resultSourceId }

  const sample = {}
  if (row.sampleId != null) {
    sample.id = row.sampleId
  }

  if (row.sampleCollectedOn != null) {
    sample.collectedOn = row.sampleCollectedOn
  }
  if (row.sampleTypeId != null) {
    sample.type = { id: row.sampleTypeId }
  }
  if (row.sampleOriginSiteId != null) {
    sample.originSite = { id: row.sampleOriginSiteId }
  }
  if (row.sampleGroup != null) {
    sample.group = row.sampleGroup
  }
  if (row.sampleRunNumber != null) {
    sample.runNumber = row.sampleRunNumber
  }
  if (!_.isEmpty(sample)) {
    result.sample = sample
  }

  const categories = []
  if (row.category1Id != null) {
    categories.push({ id: row.category1Id })
  }
  if (row.category2Id != null) {
    categories.push({ id: row.category2Id })
  }
  if (categories.length > 0) {
    result.category = categories
  }

  result.data = JSON.parse(row.resultData)
  if (row.formData != null) {
    result.formData = JSON.parse(row.formData)
  }

  if (row.startedOn != null) {
    result.startedOn = row.startedOn
  }

  if (row.endedOn != null) {
    result.endedOn = row.endedOn
  }

  const consumable = {
    serial: row.consumableSerial,
    lot: row.consumableLot,
    expirationDate: row.consumableExpirationDate,
  }
  if (consumable.serial != null || consumable.lot != null || consumable.expirationDate != null) {
    result.consumable = [consumable]
  }

  const instrument = { serial: row.instrumentSerial }
  const module = { name: row.moduleName, serial: row.moduleSerial }
  if (module.name != null || module.serial != null) {
    instrument.module = module
  }

  if (instrument.serial != null || instrument.module != null) {
    result.instrument = instrument
  }

  const research = { id: row.researchId }
  if (research.id != null) {
    result.research = research
  }

  if (row.patientData != null) {
    result.patient = JSON.parse(row.patientData)
  }

  if (row.oemData != null) {
    result.oemData = row.oemData
  }

  if (row.rawData != null) {
    result.rawData = row.rawData
  }

  const sender = { version: row.senderVersion, operator: row.senderOperator }
  if (sender.version != null || sender.operator != null) {
    result.sender = sender
  }
  if (row.notes != null) {
    result.notes = row.notes
  }

  const error = { code: row.errorCode, notes: row.errorNotes }
  if (error.code != null || error.notes != null) {
    result.error = error
  }

  return result
}

async function postProcessMergeResult(context, result) {
  const { knex, payload, messageContext, userId } = context

  await resolveAutoTagging(knex, result)
  await consumeInventoryFromPayload(knex, payload, result, messageContext, userId)
  return {}
}

/**
 * Consumes inventory for the new result
 */
async function consumeInventoryFromPayload(knex, payload, result, messageContext, userId) {
  const consumablesInResultData = _.isEmpty(payload.consumable) ? [] : payload.consumable
  const expirationDate = consumablesInResultData[0]?.expirationDate
  const lotNumber = consumablesInResultData[0]?.lot

  await consumeInventoryForResult({
    knex,
    resultId: result.id,
    assayId: result.assayId,
    siteId: result.siteId,
    lotNumber,
    expirationDate,
    partnerId: result.partnerId,
    testStartedOn: result.startedOn,
    messageContext,
    userId,
  })
}

const getTags = (regExp, field) => {
  const re = new RegExp(regExp, 'g')
  return field && field !== '' ? field.toString().match(re) : []
}

async function resolveAutoTagging(knex, result) {
  const country = await getCountryByDeviceId(knex, result.deviceId)

  // taggingResults is array of strings ['']
  const taggingResults = getAllResultTags(country, result)
  // existingTags is array [{ id: number, title: 'string' }]
  const existingTags = await getExistingTagByPartner(knex, result.partnerId, taggingResults, result.id)

  const tagsToBeAdded = _.uniqBy(_.filter(taggingResults, tag => !includesIgnoreCase(existingTags, tag)))

  const tagsToBeUpdated = _.uniqBy(
    _.filter(existingTags, tag =>
      includesIgnoreCase(
        taggingResults.map(title => ({ title })),
        tag.title
      )
    )
  )

  _.map(tagsToBeAdded, async tag => {
    const [tagId] = await knex('Tag').insert({
      title: tag,
      partnerId: result.partnerId,
    })
    await knex('ResultTag').insert({
      tagId,
      resultId: result.id,
    })
  })
  _.map(tagsToBeUpdated, async elem => {
    await knex('ResultTag').insert({
      tagId: elem.id,
      resultId: result.id,
    })
  })
}

function includesIgnoreCase(collection, value) {
  return _.some(collection, item => item.title.toLowerCase() === value.toLowerCase())
}

async function getCountryByDeviceId(knex, deviceId) {
  return knex('Device as d')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('d.id', deviceId)
    .first()
}

function getAllResultTags(country, result) {
  let taggingResults = []
  let res = []
  if (country) {
    if (country.tagRegexSampleId && country.tagRegexSampleId !== '') {
      res = getTags(country.tagRegexSampleId, result.sampleId)

      if (res) taggingResults = taggingResults.concat(res)
    }

    if (country.tagRegexNotes && country.tagRegexNotes !== '') {
      res = getTags(country.tagRegexNotes, result.notes)
      if (res) taggingResults = taggingResults.concat(res)
    }
    const patientData = JSON.parse(result.patientData)
    if (patientData && country.tagRegexPatientId && country.tagRegexPatientId !== '') {
      res = getTags(country.tagRegexPatientId, patientData.id)
      if (res) taggingResults = taggingResults.concat(res)
    }
  }
  return _.uniqBy(taggingResults)
}

async function getExistingTagByPartner(knex, partnerId, taggingResults, resultId) {
  return knex('Tag as t')
    .join('ResultTag as rt', 't.id', 'rt.tagId')
    .select('t.id', 't.title')
    .distinct('t.id', 't.title')
    .where('t.partnerId', partnerId)
    .whereNot('rt.resultId', resultId)
    .whereIn('t.title', taggingResults)
}

module.exports = {
  getResult,
  postProcessMergeResult,
  consumeInventoryFromPayload,
  getAllResultTags,
}
