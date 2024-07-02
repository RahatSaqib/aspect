const Boom = require('@hapi/boom')
const _ = require('lodash')
const { isJson, deepMerge } = require('../shared/json')
const { mergeResultWithPayload } = require('../result/common/logic')
const { getCustomFieldsFromPayload } = require('../forms/service')
const { convertStringToFloat } = require('../shared/string')
const {
  resultSourceToId,
  resultCategoryToId,
  resultTypeToId,
  resultWorkflowStatusToId,
  sampleTypeToId,
} = require('../shared/dictionary')
const { insertSite } = require('../site/common/db')
const { getLatestResultWorkflowLog } = require('./result')

async function mergeResult(knex, deviceId, payload, { now = new Date(), sampleId = null } = {}, context) {
  const sampleExternalId = _.get(payload, 'sample.id', null)

  const existingResult = await getResultRecord(knex, payload, deviceId, context?.existingResultId)

  const testStartedOn = _.get(payload, 'startedOn', _.get(existingResult, 'startedOn', null))
  // Select ResultType if specified, otherwise Patient
  const resultTypeId = await getResultTypeId(payload, existingResult)

  // Select Workflow Status if specified, otherwise Error or OK depending on error payload
  const resultWorkflowStatusId = await getResultWorkflowStatusId(knex, payload, existingResult)

  // Categories if specified, otherwise Error or Success depending on error payload
  const { categoryIds, resultCategory1, resultCategory2 } = await getResultCategories(payload, existingResult)

  // Gets the site that is linked to the device as well as the valid types of assays that can be used on the device
  const { assays, site } = await getSiteAndAssays(knex, payload, existingResult, deviceId)

  // Exit on any error
  const requestErrors = await getResultErrors({ site, resultTypeId, resultCategory1, assays, categoryIds, payload })
  if (!_.isEmpty(requestErrors)) {
    throw Boom.badRequest(`Cannot find ${requestErrors.join(', ')}`)
  }

  const [assay] = assays

  // Select ResultSource if specified, otherwise from Assay
  const resultSourceId = await getResultSourceId(payload, existingResult, assay)

  let sampleTypeId = null
  const payloadSampleTypeId = _.get(payload, 'sample.type.id', false)
  if (payloadSampleTypeId) {
    sampleTypeId = await sampleTypeToId(payloadSampleTypeId)
    if (sampleTypeId == null) {
      throw Boom.badRequest(`Cannot find sample type ${payloadSampleTypeId}`)
    }
  }

  const { sampleOriginSiteId, reportableSiteId, payloadOriginSiteId } = await getSiteIdVarieties(
    knex,
    payload,
    site,
    now
  )

  if (!sampleId) {
    sampleId = await getExistingSampleIdInCountry(
      knex,
      sampleExternalId,
      payloadSampleTypeId,
      site.countryId,
      testStartedOn
    )
  }

  const opts = { sampleId, sampleTypeId, sampleOriginSiteId, payloadOriginSiteId, payloadSampleTypeId }
  const existingSampleDetails = await getExistingSample(knex, payload, existingResult, opts)
  ;({ sampleId } = existingSampleDetails)

  const { patientData, resultData, resultDataHash, shouldTriggerResultNotification } = mergeResultWithPayload(
    existingResult,
    payload
  )

  const preProcessedResult = {
    latitude: _.get(payload, 'location.latitude', _.get(existingResult, 'latitude', site.latitude)),
    longitude: _.get(payload, 'location.longitude', _.get(existingResult, 'longitude', site.longitude)),
    assayId: assay.id,
    assayVersion: _.get(payload, 'assay.version', _.get(existingResult, 'assayVersion', null)),
    resultTypeId,
    resultSourceId,
    sampleId,
    sampleRunNumber: _.get(payload, 'sample.runNumber', _.get(existingResult, 'sampleRunNumber', null)),
    sampleGroup: _.get(payload, 'sample.group', _.get(existingResult, 'sampleGroup', null)),
    resultCategory1,
    resultCategory2,
    resultData,
    resultDataHash,
    startedOn: testStartedOn,
    endedOn: _.get(payload, 'endedOn', _.get(existingResult, 'endedOn', null)),
    consumableSerial: _.get(payload, 'consumable[0].serial', _.get(existingResult, 'consumableSerial', null)),
    consumableExpirationDate: _.get(
      payload,
      'consumable[0].expirationDate',
      _.get(existingResult, 'consumableExpirationDate', null)
    ),
    consumableLot: _.get(payload, 'consumable[0].lot', _.get(existingResult, 'consumableLot', null)),
    instrumentSerial: _.get(payload, 'instrument.serial', _.get(existingResult, 'instrumentSerial', null)),
    moduleSerial: _.get(payload, 'instrument.module.serial', _.get(existingResult, 'moduleSerial', null)),
    moduleName: _.get(payload, 'instrument.module.name', _.get(existingResult, 'moduleName', null)),
    oemData: _.has(payload, 'oemData') ? String(payload.oemData) : _.get(existingResult, 'oemData'),
    rawData: _.has(payload, 'rawData') ? String(payload.rawData) : _.get(existingResult, 'rawData'),
    researchId: _.get(payload, 'research.id', _.get(existingResult, 'researchId', null)),
    patientData,
    senderVersion: _.get(payload, 'sender.version', _.get(existingResult, 'senderVersion', null)),
    senderOperator: _.get(payload, 'sender.operator', _.get(existingResult, 'senderOperator', null)),
    notes: _.get(payload, 'notes', _.get(existingResult, 'notes', null)),
    errorCode: _.get(payload, 'error.code', _.get(existingResult, 'errorCode', null)),
    errorNotes: _.get(payload, 'error.notes', _.get(existingResult, 'errorNotes', null)),
    updatedOn: now,
    createdOn: _.get(existingResult, 'createdOn', now),
    reportableSiteId,
    gxAlertTestId: _.get(payload, 'gxAlertTestId'),
    gxAlertSyncedOn: _.get(payload, 'gxAlertTestId') ? now : null,
  }

  // Add custom fields
  const customFieldsData = await getCustomFieldsFromPayload(
    payload,
    await getCountryAbbreviationByDeviceId(knex, deviceId),
    site.partnerId,
    assay.id
  )

  const preProcessedResultWithCustomFields = _.merge(preProcessedResult, customFieldsData)

  const result = {
    ...preProcessedResultWithCustomFields,
    resultData: JSON.stringify(preProcessedResultWithCustomFields.resultData),
    patientData: !_.isEmpty(preProcessedResultWithCustomFields.patientData)
      ? JSON.stringify(preProcessedResultWithCustomFields.patientData)
      : null,
  }

  // Processed result contains result with additional fields
  // we want to insert but never update and will be passed to
  // plugins for further processing. It should contain all columns
  // from the Result table
  const processedResult = {
    externalId: payload.id,
    deviceId,
    partnerId: site.partnerId,
    siteId: site.id,
    createdOn: now,
    ...result,
  }

  let resultId
  if (existingResult) {
    resultId = existingResult.id
    await knex('Result').where({ id: resultId }).update(result)
  } else {
    ;[resultId] = await knex('Result').insert(processedResult)
  }

  const [lastLogId] = await knex('ResultWorkflowLog').insert({
    resultId,
    resultWorkflowStatusId,
    createdOn: now,
    changedOn: now,
    createdBy: 1,
  })
  await knex('Result').where({ id: resultId }).update({
    resultWorkflowStatusLogId: lastLogId,
    updatedOn: now,
  })
  processedResult.resultWorkflowStatusLogId = lastLogId
  processedResult.resultWorkflowStatusId = resultWorkflowStatusId
  processedResult.id = resultId
  processedResult.updatedOn = now
  return {
    processedResult,
    existingResult,
    shouldTriggerResultNotification,
  }
}

async function getResultRecord(knex, payload, deviceId, resultId) {
  let result = null
  const baseQuery = knex('Result as r').first()
  if (resultId) {
    result = await baseQuery.where('r.id', resultId)
  } else if (payload.id) {
    result = await baseQuery.where({
      'r.externalId': payload.id,
      'r.deviceId': deviceId,
    })
  }

  return result
}

async function getResultTypeId(payload, existingResult) {
  let resultTypeId = null
  if (_.has(payload, 'type.id')) {
    resultTypeId = await resultTypeToId(_.get(payload, 'type.id'))
  } else if (existingResult) {
    ;({ resultTypeId } = existingResult)
  } else {
    resultTypeId = await resultTypeToId('Patient')
  }
  return resultTypeId
}

async function getResultWorkflowStatusId(knex, payload, existingResult) {
  let resultWorkflowStatusId = null
  if (_.has(payload, 'workflow.status.id')) {
    resultWorkflowStatusId = await resultWorkflowStatusToId(_.get(payload, 'workflow.status.id', ''))
  } else if (
    payload.error ||
    (_.get(payload, 'data.resultText') && _.get(payload, 'data.resultText').toUpperCase().indexOf('ERROR') !== -1)
  ) {
    resultWorkflowStatusId = await resultWorkflowStatusToId('Error')
  } else if (existingResult) {
    ;({ resultWorkflowStatusId } = await getLatestResultWorkflowLog(knex, existingResult.id))
  } else {
    resultWorkflowStatusId = await resultWorkflowStatusToId('OK')
  }
  return resultWorkflowStatusId
}

async function getResultCategories(payload, existingResult) {
  const categoryIds = _.map(payload.category, 'id')
  let resultCategory1 = null
  let resultCategory2 = null
  if (categoryIds.length > 0 && categoryIds[0]) {
    resultCategory1 = await resultCategoryToId(categoryIds[0])
  } else if (payload.error) {
    resultCategory1 = await resultCategoryToId('Error')
  } else if (existingResult && existingResult.resultCategory1) {
    ;({ resultCategory1 } = existingResult)
  } else {
    resultCategory1 = await resultCategoryToId('Success')
  }
  if (categoryIds.length > 1 && categoryIds[1]) {
    resultCategory2 = await resultCategoryToId(categoryIds[1])
  } else if (existingResult && existingResult.resultCategory2) {
    resultCategory2 = null
  }
  return { categoryIds, resultCategory1, resultCategory2 }
}

async function getResultErrors({ site, resultTypeId, resultCategory1, assays, categoryIds, payload }) {
  const requestErrors = []
  if (!site) {
    requestErrors.push('assigned site for device')
  }
  if (!resultTypeId) {
    requestErrors.push(`result type with id ${_.get(payload, 'type.id')}`)
  }
  if (!resultCategory1) {
    requestErrors.push(`result categories with ids ${categoryIds.join(' ')}`)
  }
  if (assays?.length !== 1) {
    requestErrors.push(`assay with id ${_.get(payload, 'assay.id')}`)
  }
  return requestErrors
}

async function getResultSourceId(payload, existingResult, assay) {
  let resultSourceId = null
  if (_.has(payload, 'source.id')) {
    resultSourceId = await resultSourceToId(_.get(payload, 'source.id', ''))
    if (!resultSourceId) {
      throw Boom.badRequest(`Cannot find result source with id ${_.get(payload, 'source.id')}`)
    }
  } else if (existingResult) {
    ;({ resultSourceId } = existingResult)
  } else {
    ;({ resultSourceId } = assay)
  }
  return resultSourceId
}

async function getSiteIdVarieties(knex, payload, site, now) {
  let sampleOriginSiteId = site.id
  let reportableSiteId = site.id
  const payloadOriginSiteId = _.get(payload, 'sample.originSite.id', false)
  if (payloadOriginSiteId) {
    const originSiteStateName = _.get(payload, 'sample.originSite.state')
    let { id: originSiteGeographyId } =
      (await knex('Geography')
        .where('countryId', site.countryId)
        .whereNull('stateId')
        .whereNull('lgaId')
        .first('id')) || {}
    if (originSiteStateName) {
      let { id: originSiteStateId } =
        (await knex('State as s')
          .join('Geography as g', 's.id', 'g.stateId')
          .where({
            'g.countryId': site.countryId,
            's.name': originSiteStateName,
          })
          .first('s.id')) || {}
      if (!originSiteStateId) {
        ;[originSiteStateId] = await knex('State').insert({
          name: originSiteStateName,
        })
      }
      let { id: originSiteStateGeographyId } =
        (await knex('Geography')
          .whereNull('lgaId')
          .andWhere({
            countryId: site.countryId,
            stateId: originSiteStateId,
          })
          .first('id')) || {}
      if (!originSiteStateGeographyId) {
        ;[originSiteStateGeographyId] = await knex('Geography').insert({
          countryId: site.countryId,
          stateId: originSiteStateId,
        })
      }
      originSiteGeographyId = originSiteStateGeographyId
      const originSiteLgaName = _.get(payload, 'sample.originSite.lga')
      if (originSiteLgaName) {
        let { id: originSiteLgaId } =
          (await knex('Lga as l')
            .join('Geography as g', 'l.id', 'g.lgaId')
            .where({
              'g.stateId': originSiteStateId,
              'l.name': originSiteLgaName,
            })
            .first('l.id')) || {}
        if (!originSiteLgaId) {
          ;[originSiteLgaId] = await knex('Lga').insert({
            name: originSiteLgaName,
          })
        }
        let { id: originSiteLgaGeographyId } =
          (await knex('Geography')
            .where({
              countryId: site.countryId,
              stateId: originSiteStateId,
              lgaId: originSiteLgaId,
            })
            .first('id')) || {}
        if (!originSiteLgaGeographyId) {
          ;[originSiteLgaGeographyId] = await knex('Geography').insert({
            countryId: site.countryId,
            stateId: originSiteStateId,
            lgaId: originSiteLgaId,
          })
        }
        originSiteGeographyId = originSiteLgaGeographyId
      }
    }
    let sampleOriginSite = await knex('Site')
      .where({ partnerId: site.partnerId, externalId: payloadOriginSiteId })
      .first()
    let siteGeography = {}
    if (sampleOriginSite && sampleOriginSite.geographyId) {
      siteGeography = await knex('Geography').where('id', sampleOriginSite.geographyId).first()
    }
    if (originSiteGeographyId) {
      const originSiteGeography = (await knex('Geography').where('id', originSiteGeographyId).first()) || {}
      if (originSiteGeography.countryId && !siteGeography.countryId) {
        siteGeography.countryId = originSiteGeography.countryId
      }
      if (siteGeography.countryId && originSiteGeography.stateId && !siteGeography.stateId) {
        siteGeography.stateId = originSiteGeography.stateId
      }
      if (siteGeography.stateId && originSiteGeography.lgaId && !siteGeography.lgaId) {
        siteGeography.lgaId = originSiteGeography.lgaId
      }
    }
    if (siteGeography.countryId) {
      siteGeography =
        (await knex('Geography')
          .where('countryId', siteGeography.countryId)
          .andWhere(function () {
            if (siteGeography.stateId) {
              this.where('stateId', siteGeography.stateId)
            } else {
              this.whereNull('stateId')
            }
          })
          .andWhere(function () {
            if (siteGeography.lgaId) {
              this.where('lgaId', siteGeography.lgaId)
            } else {
              this.whereNull('lgaId')
            }
          })
          .first()) || {}
    }
    const sampleOriginSiteName = _.get(payload, 'sample.originSite.name')
    const sampleOriginSiteDetailsInPayload = {
      name: sampleOriginSiteName,
      shortName: _.get(payload, 'sample.originSite.shortName'),
      notes: _.get(payload, 'sample.originSite.notes'),
      partnerId: site.partnerId,
      geographyId: siteGeography.id || originSiteGeographyId,
      city: _.get(payload, 'sample.originSite.city'),
      street1: _.get(payload, 'sample.originSite.street1'),
      street2: _.get(payload, 'sample.originSite.street2'),
      zip: _.get(payload, 'sample.originSite.zip'),
      longitude: convertStringToFloat(_.get(payload, 'sample.originSite.location.longitude')),
      latitude: convertStringToFloat(_.get(payload, 'sample.originSite.location.latitude')),
      timezoneId: _.get(payload, 'sample.originSite.timezoneId'),
      hoursStart: convertStringToFloat(_.get(payload, 'sample.originSite.hoursStart')),
      hoursEnd: convertStringToFloat(_.get(payload, 'sample.originSite.hoursEnd')),
    }
    if (!sampleOriginSite) {
      if (!sampleOriginSiteName) {
        throw Boom.badRequest(`Cannot find Sample origin site ${payloadOriginSiteId}`)
      }
      const newSampleOriginSite = {
        ...sampleOriginSiteDetailsInPayload,
        externalId: payloadOriginSiteId,
        createdOn: now,
        updatedOn: now,
      }
      if (!newSampleOriginSite.shortName) {
        newSampleOriginSite.shortName = sampleOriginSiteName
      }
      if (newSampleOriginSite.shortName.length > 45) {
        newSampleOriginSite.shortName = newSampleOriginSite.shortName.substr(0, 45)
      }
      const [newSampleOriginSiteId] = await insertSite(knex, newSampleOriginSite)
      sampleOriginSite = { id: newSampleOriginSiteId }
    } else {
      await knex('Site')
        .where('id', sampleOriginSite.id)
        .update({
          ..._.omit(sampleOriginSite, ['id']),
          ..._.omitBy(sampleOriginSiteDetailsInPayload, _.isNil),
        })
    }
    sampleOriginSiteId = sampleOriginSite.id
    reportableSiteId = sampleOriginSite.id
  }
  return { sampleOriginSiteId, reportableSiteId, payloadOriginSiteId }
}

async function getExistingSampleIdInCountry(knex, sampleExternalId, sampleTypeExternalId, countryId, testStartedOn) {
  if (!sampleExternalId) {
    return Promise.resolve(null)
  }
  const samplesOfType = await knex('Sample as s')
    .join('Site as site', 's.originSiteId', 'site.id')
    .join('Geography as g', 'site.geographyId', 'g.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .where('s.externalId', sampleExternalId)
    .andWhere('s.registeredInAspect', true)
    .andWhere('g.countryId', countryId)
    .andWhere(qb => qb.whereNull('s.collectedOn').orWhere('s.collectedOn', '<=', testStartedOn))
    .orderBy('s.collectedOn', 'desc')
    .select('s.id', 'st.externalId as sampleTypeExternalId', 's.collectedOn')
  if (samplesOfType.length === 1) {
    return samplesOfType[0].id
  }
  if (samplesOfType.length > 1) {
    if (sampleTypeExternalId) {
      const samplesWithMatchingTypes = samplesOfType.filter(s => s.sampleTypeExternalId === sampleTypeExternalId)
      if (samplesWithMatchingTypes.length > 0) {
        return samplesWithMatchingTypes[0].id
      }
    } else {
      const samplesWithMatchingTypes = samplesOfType.filter(
        s => s.sampleTypeExternalId === 'Sputum' || _.isNil(s.sampleTypeExternalId)
      )
      if (samplesWithMatchingTypes.length > 0) {
        return samplesWithMatchingTypes[0].id
      }
    }
  }
  return null
}

async function getExistingSample(knex, payload, existingResult, opts) {
  let { sampleId } = opts
  const { sampleTypeId, sampleOriginSiteId, payloadOriginSiteId, payloadSampleTypeId } = opts
  let existingSample
  if (sampleId == null && existingResult == null) {
    ;[sampleId] = await knex('Sample').insert({
      externalId: _.get(payload, 'sample.id', null),
      collectedOn: _.get(payload, 'sample.collectedOn', null),
      sampleTypeId,
      originSiteId: sampleOriginSiteId,
    })
  } else {
    if (sampleId == null) {
      ;({ sampleId } = existingResult)
    }
    if (_.has(payload, 'sample')) {
      existingSample =
        (await knex('Sample')
          .where({ id: sampleId })
          .first('externalId', 'collectedOn', 'sampleTypeId', 'originSiteId')) || {}
      await knex('Sample')
        .where({ id: sampleId })
        .update({
          externalId: _.get(payload, 'sample.id', existingSample.externalId),
          collectedOn: payload.sample.collectedOn || existingSample.collectedOn || null,
          sampleTypeId: payloadSampleTypeId ? sampleTypeId : existingSample.sampleTypeId,
          originSiteId: payloadOriginSiteId ? sampleOriginSiteId : existingSample.originSiteId,
        })
    }
  }
  return { existingSample, sampleId }
}

async function getSiteAndAssays(knex, payload, existingResult, deviceId) {
  const assayQ = knex('Assay as a')
    .join('Device as d', 'a.deviceTypeId', 'd.deviceTypeId')
    .where({ 'd.id': deviceId })
    .limit(2)
    .select('a.id', 'a.externalId', 'a.resultSourceId')
  const payloadAssayId = _.get(payload, 'assay.id', false)
  if (payloadAssayId) {
    assayQ.where({ 'a.externalId': payloadAssayId })
  } else if (existingResult) {
    assayQ.where({ 'a.id': existingResult.assayId })
  }

  const siteQ = knex('Site as s')
    .join('Device as d', 's.id', 'd.siteId')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .where({ 'd.id': deviceId })
    .first(
      's.id',
      's.partnerId',
      'g.countryId',
      's.geographyId',
      's.latitude',
      's.longitude',
      'd.defaultReportableSiteId'
    )

  const [assays, site] = await Promise.all([assayQ, siteQ])
  return { assays, site }
}

const getCountryAbbreviationByDeviceId = async (knex, deviceId) => {
  const { countryAbbreviation } = await knex('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .where({ 'd.id': deviceId })
    .first('c.abbreviation as countryAbbreviation')

  return countryAbbreviation
}

module.exports = { mergeResult }
