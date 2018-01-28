const Boom = require('boom')
const _ = require('lodash')

async function mergeResult(
  knex,
  deviceId,
  payload,
  { now = new Date(), sampleId = null } = {}
) {
  // Look up existing result matching external id if specified
  let existingResult = null
  if (payload.id) {
    const existingResults = await knex('Result as r')
      .where({
        'r.externalId': payload.id,
        'r.deviceId': deviceId,
      })
      .distinct('r.*')
      .limit(2)
    if (existingResults.length > 1) {
      throw Boom.badRequest(`Cannot find unique result with id ${payload.id}`)
    }
    ;[existingResult] = existingResults
  }

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
    .where({ 'd.id': deviceId })
    .first('s.id', 's.partnerId', 's.geographyId', 's.latitude', 's.longitude')

  // Select ResultType if specified, otherwise Patient
  const resultTypeQ = knex('ResultType as rt').first('rt.id')
  if (_.has(payload, 'type.id')) {
    resultTypeQ.where({ 'rt.externalId': _.get(payload, 'type.id') })
  } else if (existingResult) {
    resultTypeQ.where({ 'rt.id': existingResult.resultTypeId })
  } else {
    resultTypeQ.where({ 'rt.externalId': 'Patient' })
  }

  // Select Workflow Status if specified, otherwise Error or OK depending on error payload
  const resultWorkflowStatusQ = knex('ResultWorkflowStatus as rs').first(
    'rs.id'
  )
  if (_.has(payload, 'workflow.status.id')) {
    resultWorkflowStatusQ.where({
      'rs.externalId': _.get(payload, 'workflow.status.id'),
    })
  } else if (payload.error) {
    resultWorkflowStatusQ.where({ 'rs.externalId': 'Error' })
  } else if (existingResult) {
    resultWorkflowStatusQ.where({
      'rs.id': existingResult.resultWorkflowStatusId,
    })
  } else {
    resultWorkflowStatusQ.where({ 'rs.externalId': 'OK' })
  }

  // Categories if specified, otherwise Error or Success depending on error payload
  const categoryQ = knex('ResultCategory as rc').select('rc.id')
  const categoryIds = _.compact(_.map(payload.category, 'id'))
  if (categoryIds.length > 0) {
    categoryQ.whereIn('rc.externalId', categoryIds)
  } else if (payload.error) {
    categoryQ.where({ 'rc.externalId': 'Error' })
  } else if (existingResult) {
    categoryQ.whereIn(
      'rc.id',
      _.compact([
        existingResult.resultCategory1,
        existingResult.resultCategory2,
      ])
    )
  } else {
    categoryQ.where({ 'rc.externalId': 'Success' })
  }

  const [
    assays,
    site,
    resultType,
    resultWorkflowStatus,
    categories,
  ] = await Promise.all([
    assayQ,
    siteQ,
    resultTypeQ,
    resultWorkflowStatusQ,
    categoryQ,
  ])

  if (
    !site ||
    !resultType ||
    !resultWorkflowStatus ||
    categories.length === 0 ||
    assays.length !== 1
  ) {
    const requestErrors = []
    if (!site) {
      requestErrors.push('assigned site for device')
    }
    if (!resultType) {
      requestErrors.push(`result type with id ${_.get(payload, 'type.id')}`)
    }
    if (!resultWorkflowStatus) {
      requestErrors.push(
        `result workflow status id ${_.get(payload, 'workflow.status.id')}`
      )
    }
    if (categories.length === 0) {
      requestErrors.push(`result categories with ids ${categoryIds.join(' ')}`)
    }
    if (assays.length !== 1) {
      requestErrors.push(`assay with id ${_.get(payload, 'assay.id')}`)
    }
    throw Boom.badRequest(`Cannot find ${requestErrors.join(', ')}`)
  }

  const assay = assays[0]

  // Select ResultSource if specified, otherwise from Assay
  let resultSource
  if (_.has(payload, 'source.id')) {
    resultSource = await knex('ResultSource as rs')
      .where({ 'rs.externalId': _.get(payload, 'source.id') })
      .first('rs.id')
    if (!resultSource) {
      throw Boom.badRequest(
        `Cannot find result source with id ${_.get(payload, 'source.id')}`
      )
    }
  } else if (existingResult) {
    resultSource = { id: existingResult.resultSourceId }
  } else {
    resultSource = { id: assay.resultSourceId }
  }

  let sampleTypeId = null
  const payloadSampleTypeId = _.get(payload, 'sample.type.id', false)
  if (payloadSampleTypeId) {
    sampleTypeId = (await knex('SampleType')
      .where({ externalId: payloadSampleTypeId })
      .first('id')).id
  }

  let sampleOriginSiteId = site.id
  const payloadOriginSiteId = _.get(payload, 'sample.originSite.id', false)
  if (payloadOriginSiteId) {
    sampleOriginSiteId = (await knex('Site')
      .where({ partnerId: site.partnerId, externalId: payloadOriginSiteId })
      .first('id')).id
  }

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
      const existingSample = await knex('Sample')
        .where({ id: sampleId })
        .first('externalId', 'collectedOn', 'sampleTypeId', 'originSiteId')
      await knex('Sample')
        .where({ id: sampleId })
        .update({
          externalId: _.get(payload, 'sample.id', existingSample.externalId),
          collectedOn: _.get(
            payload,
            'sample.collectedOn',
            _.get(existingSample, 'collectedOn', null)
          ),
          sampleTypeId: payloadSampleTypeId
            ? sampleTypeId
            : existingSample.sampleTypeId,
          originSiteId: payloadOriginSiteId
            ? sampleOriginSiteId
            : existingSample.originSiteId,
        })
    }
  }

  // TODO should we merge within patient or result data payload?
  const resultData = _.has(payload, 'data')
    ? JSON.stringify(payload.data)
    : _.get(existingResult, 'resultData', null)

  const patientData = _.has(payload, 'patient')
    ? JSON.stringify(payload.patient)
    : _.get(existingResult, 'patientData')

  const oemData = _.has(payload, 'oemData')
    ? String(payload.oemData)
    : _.get(existingResult, 'oemData')

  const rawData = _.has(payload, 'rawData')
    ? String(payload.rawData)
    : _.get(existingResult, 'rawData')

  const result = {
    latitude: _.get(
      payload,
      'location.latitude',
      _.get(existingResult, 'latitude', site.latitude)
    ),
    longitude: _.get(
      payload,
      'location.longitude',
      _.get(existingResult, 'longitude', site.longitude)
    ),
    assayId: assay.id,
    assayVersion: _.get(
      payload,
      'assay.version',
      _.get(existingResult, 'assayVersion', null)
    ),
    resultTypeId: resultType.id,
    resultSourceId: resultSource.id,
    resultWorkflowStatusId: resultWorkflowStatus.id,
    sampleId,
    sampleRunNumber: _.get(
      payload,
      'sample.runNumber',
      _.get(existingResult, 'sampleRunNumber', null)
    ),
    sampleGroup: _.get(
      payload,
      'sample.group',
      _.get(existingResult, 'sampleGroup', null)
    ),
    resultCategory1: _.get(categories, '[0].id', null),
    resultCategory2: _.get(categories, '[1].id', null),
    resultData,
    startedOn: _.get(
      payload,
      'startedOn',
      _.get(existingResult, 'startedOn', null)
    ),
    endedOn: _.get(payload, 'endedOn', _.get(existingResult, 'endedOn', null)),
    consumableSerial: _.get(
      payload,
      'consumable[0].serial',
      _.get(existingResult, 'consumableSerial', null)
    ),
    consumableExpirationDate: _.get(
      payload,
      'consumable[0].expirationDate',
      _.get(existingResult, 'consumableExpirationDate', null)
    ),
    consumableLot: _.get(
      payload,
      'consumable[0].lot',
      _.get(existingResult, 'consumableLot', null)
    ),
    instrumentSerial: _.get(
      payload,
      'instrument.serial',
      _.get(existingResult, 'instrumentSerial', null)
    ),
    moduleSerial: _.get(
      payload,
      'instrument.module.serial',
      _.get(existingResult, 'moduleSerial', null)
    ),
    moduleName: _.get(
      payload,
      'instrument.module.name',
      _.get(existingResult, 'moduleName', null)
    ),
    oemData,
    rawData,
    researchId: _.get(
      payload,
      'research.id',
      _.get(existingResult, 'researchId', null)
    ),
    patientData,
    senderVersion: _.get(
      payload,
      'sender.version',
      _.get(existingResult, 'senderVersion', null)
    ),
    senderOperator: _.get(
      payload,
      'sender.operator',
      _.get(existingResult, 'senderOperator', null)
    ),
    notes: _.get(payload, 'notes', _.get(existingResult, 'notes', null)),
    errorCode: _.get(
      payload,
      'error.code',
      _.get(existingResult, 'errorCode', null)
    ),
    errorNotes: _.get(
      payload,
      'error.notes',
      _.get(existingResult, 'errorNotes', null)
    ),
    updatedOn: now,
  }

  // Processed result contains result with additional fields
  // we want to insert but never update and will be passed to
  // plugins for further processing. It should contain all columns
  // from the Result table
  const processedResult = Object.assign(
    {
      externalId: payload.id,
      deviceId,
      partnerId: site.partnerId,
      geographyId: site.geographyId,
      siteId: site.id,
      createdOn: now,
    },
    result
  )
  let resultId
  if (existingResult) {
    resultId = existingResult.id
    await knex('Result')
      .where({ id: resultId })
      .update(result)
  } else {
    ;[resultId] = await knex('Result').insert(processedResult)
  }
  processedResult.id = resultId
  return { processedResult, existingResult }
}

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
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .where('r.id', resultId)
    .first(
      'r.externalId as resultExternalId',
      'r.resultData',
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
      'rs.externalId as resultWorkflowStatusId',
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

  const resultWorkflowLog = await knex('ResultWorkflowLog')
    .where({ resultId: row.resultId })
    .orderBy('createdOn', 'desc')
    .orderBy('id', 'desc')
    .first('operator', 'changedOn')

  const result = {}

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
  result.workflow = { status: { id: row.resultWorkflowStatusId } }
  if (resultWorkflowLog) {
    result.workflow.changedOn = resultWorkflowLog.changedOn
    if (resultWorkflowLog.operator != null) {
      result.workflow.operator = resultWorkflowLog.operator
    }
  }

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
  if (
    consumable.serial != null ||
    consumable.lot != null ||
    consumable.expirationDate != null
  ) {
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

module.exports = {
  mergeResult,
  getResult,
}
