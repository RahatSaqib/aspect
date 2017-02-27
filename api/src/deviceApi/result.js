const Boom = require('boom')
const _ = require('lodash')
const { consumeInventoryForResult } = require('../inventory/service')
const { addResultConstraints } = require('./common')

function* addResult(context) {
  const { knex, payload, now } = context
  // TODO seperate permissions for device add vs update result?
  // Look up existing result matching external id if specified
  let existingResult = null
  if (payload.id) {
    const existingResults = yield knex('Result as r')
      .where({ 'r.externalId': payload.id })
      .innerJoin('Device as d', 'r.deviceId', 'd.id')
      .leftJoin('Sample as s', 'r.sampleId', 's.id')
      .modify(addResultConstraints, context, { device: 'd', result: 'r', sample: 's' })
      .distinct('r.*')
      .limit(2)
    if (existingResults.length > 1) {
      return Boom.badRequest()
    }
    existingResult = existingResults[0]
  }
  const deviceId = existingResult ? existingResult.deviceId : context.device.id

  const assayQ = knex('Assay as a')
    .join('Device as d', 'a.deviceTypeId', 'd.deviceTypeId')
    .where({ 'd.id': deviceId })
    .limit(2)
    .select('a.id', 'a.externalId')
  const payloadAssayId = _.get(payload, 'assay.id', false)
  if (payloadAssayId) {
    assayQ.where({ 'a.externalId': payloadAssayId })
  } else if (existingResult) {
    assayQ.where({ 'a.id': existingResult.assayId })
  }

  const siteQ = knex('Site as s')
    .join('Device as d', 's.id', 'd.siteId')
    .where({ 'd.id': deviceId })
    .first('s.id', 's.partnerId', 's.orgUnitId',
      's.geographyId', 's.latitude', 's.longitude')

  // Select ResultType if specified, otherwise Patient
  const resultTypeQ = knex('ResultType as rt')
    .first('rt.id')
  if (_.has(payload, 'type.id')) {
    resultTypeQ.where({ 'rt.externalId': _.get(payload, 'type.id') })
  } else if (existingResult) {
    resultTypeQ.where({ 'rt.id': existingResult.resultTypeId })
  } else {
    resultTypeQ.where({ 'rt.externalId': 'Patient' })
  }

  // Select Workflow Status if specified, otherwise Error or OK depending on error payload
  const resultWorkflowStatusQ = knex('ResultWorkflowStatus as rs')
    .first('rs.id')
  if (_.has(payload, 'workflow.status.id')) {
    resultWorkflowStatusQ.where({ 'rs.externalId': _.get(payload, 'workflow.status.id') })
  } else if (payload.error) {
    resultWorkflowStatusQ.where({ 'rs.externalId': 'Error' })
  } else if (existingResult) {
    resultWorkflowStatusQ.where({ 'rs.id': existingResult.resultWorkflowStatusId })
  } else {
    resultWorkflowStatusQ.where({ 'rs.externalId': 'OK' })
  }

  // Categories if specified, otherwise Error or Success depending on error payload
  const categoryQ = knex('ResultCategory as rc')
    .select('rc.id')
  const categoryIds = _.compact(_.map(payload.category, 'id'))
  if (categoryIds.length > 0) {
    categoryQ.whereIn('rc.externalId', categoryIds)
  } else if (payload.error) {
    categoryQ.where({ 'rc.externalId': 'Error' })
  } else if (existingResult) {
    categoryQ.whereIn('rc.id', _.compact(
      [existingResult.resultCategory1, existingResult.resultCategory2]))
  } else {
    categoryQ.where({ 'rc.externalId': 'Success' })
  }

  const [assays, site, resultType, resultWorkflowStatus, categories] = yield Promise.all(
    [assayQ, siteQ, resultTypeQ, resultWorkflowStatusQ, categoryQ])

  if (!site || !resultType || !resultWorkflowStatus ||
      categories.length === 0 || assays.length !== 1) {
    return Boom.badRequest()
  }

  const assay = assays[0]

  let sampleTypeId = null
  const payloadSampleTypeId = _.get(payload, 'sample.type.id', false)
  if (payloadSampleTypeId) {
    sampleTypeId = (yield knex('SampleType')
      .where({ externalId: payloadSampleTypeId })
      .first('id')).id
  }

  let sampleOriginSiteId = site.id
  const payloadOriginSiteId = _.get(payload, 'sample.originSite.id', false)
  if (payloadOriginSiteId) {
    // TODO Do we need to authorize this Device can link to Sample origin site?
    sampleOriginSiteId = (yield knex('Site')
      .where({ partnerId: site.partnerId, externalId: payloadOriginSiteId })
      .first('id')).id
  }

  let sampleId
  if (!existingResult) {
    [sampleId] = yield knex('Sample').insert({
      externalId: _.get(payload, 'sample.id', null),
      collectedOn: _.get(
        payload, 'sample.collectedOn', null),
      sampleTypeId,
      originSiteId: sampleOriginSiteId
    })
  } else {
    sampleId = existingResult.sampleId
    if (_.has(payload, 'sample')) {
      const existingSample = yield knex('Sample')
        .where({ id: sampleId })
        .first('externalId', 'collectedOn', 'sampleTypeId', 'originSiteId')
      yield knex('Sample')
        .where({ id: sampleId })
        .update({
          externalId: _.get(payload, 'sample.id', existingSample.externalId),
          collectedOn: _.get(
            payload, 'sample.collectedOn',
            _.get(existingSample, 'collectedOn', null)),
          sampleTypeId: payloadSampleTypeId
            ? sampleTypeId
            : existingSample.sampleTypeId,
          originSiteId: payloadOriginSiteId
            ? sampleOriginSiteId
            : existingSample.originSiteId
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

  const result = {
    latitude: _.get(
      payload, 'location.latitude',
      _.get(existingResult, 'latitude', site.latitude)),
    longitude: _.get(
      payload, 'location.longitude',
      _.get(existingResult, 'longitude', site.longitude)),
    assayId: assay.id,
    assayVersion: _.get(
      payload, 'assay.version',
      _.get(existingResult, 'assayVersion', null)),
    resultTypeId: resultType.id,
    resultWorkflowStatusId: resultWorkflowStatus.id,
    sampleId,
    resultCategory1: _.get(categories, '[0].id', null),
    resultCategory2: _.get(categories, '[1].id', null),
    resultData,
    startedOn: _.get(
      payload, 'startedOn',
      _.get(existingResult, 'startedOn', null)),
    endedOn: _.get(
      payload, 'endedOn',
      _.get(existingResult, 'endedOn', null)),
    consumableSerial: _.get(
      payload, 'consumable[0].serial',
      _.get(existingResult, 'consumableSerial', null)),
    consumableExpirationDate: _.get(
      payload, 'consumable[0].expirationDate',
      _.get(existingResult, 'consumableExpirationDate', null)),
    consumableLot: _.get(
      payload, 'consumable[0].lot',
      _.get(existingResult, 'consumableLot', null)),
    instrumentSerial: _.get(
      payload, 'instrument.serial',
      _.get(existingResult, 'instrumentSerial', null)),
    moduleSerial: _.get(
      payload, 'instrument.module.serial',
      _.get(existingResult, 'moduleSerial', null)),
    moduleName: _.get(
      payload, 'instrument.module.name',
      _.get(existingResult, 'moduleName', null)),
    researchId: _.get(
      payload, 'research.id',
      _.get(existingResult, 'researchId', null)),
    patientData,
    senderVersion: _.get(
      payload, 'sender.version',
      _.get(existingResult, 'senderVersion', null)),
    senderOperator: _.get(
      payload, 'sender.operator',
      _.get(existingResult, 'senderOperator', null)),
    notes: _.get(
      payload, 'notes',
      _.get(existingResult, 'notes', null)),
    errorCode: _.get(
      payload, 'error.code',
      _.get(existingResult, 'errorCode', null)),
    errorNotes: _.get(
      payload, 'error.notes',
      _.get(existingResult, 'errorNotes', null)),
    updatedOn: now
  }

  let resultId
  if (existingResult) {
    resultId = existingResult.id
    yield knex('Result')
      .where({ id: resultId })
      .update(result)
  } else {
    [resultId] = yield knex('Result').insert(Object.assign({
      externalId: payload.id,
      deviceId,
      partnerId: site.partnerId,
      orgUnitId: site.orgUnitId,
      geographyId: site.geographyId,
      siteId: site.id,
      createdOn: now
    }, result))
  }
  context.addResultId(resultId)

  // Log Result Workflow Update if any field changed
  let resultWorkflowChanged = !existingResult ||
    existingResult.resultWorkflowStatusId !== result.resultWorkflowStatusId
  if (!resultWorkflowChanged && (_.has(payload, 'workflow.operator')
      || _.has(payload, 'workflow.changedOn'))) {
    // check to see if operator or changedOn is different from latest log
    const resultWorkflowLog = yield* getLatestResultWorkflowLog(knex, existingResult.id)
    resultWorkflowChanged = !resultWorkflowLog ||
      _.get(payload, 'workflow.operator', null) !== resultWorkflowLog.operator ||
      +_.get(payload, 'workflow.changedOn', NaN) !== +resultWorkflowLog.changedOn
  }

  if (resultWorkflowChanged) {
    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId: result.resultWorkflowStatusId,
      operator: _.get(payload, 'workflow.operator', null),
      changedOn: _.get(payload, 'workflow.changedOn', now),
      createdOn: now
    })
  }

  // Update Inventory Levels at Site
  const consumablesInResultData = _.isEmpty(payload.consumable) ? [] : payload.consumable
  yield* consumeInventoryForResult(
    resultId, assay.id, site.id, consumablesInResultData, site.partnerId,
    result.startedOn, result.endedOn, knex)

  return {}
}

function* getResult(context) {
  const { knex, deviceLog } = context

  const resultQuery = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('SampleType as st', 's.sampleTypeId', 'st.id')
    .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .innerJoin('DeviceLog as dl', 'dl.resultId', 'r.id')
    .where('dl.id', deviceLog.id)
    .first(
      'r.externalId as resultExternalId', 'r.resultData', 'r.patientData',
      'r.startedOn', 'r.endedOn', 'r.updatedOn', 'r.researchId', 'r.notes',
      'r.senderVersion', 'r.senderOperator', 'r.errorCode', 'r.errorNotes',
      'r.consumableSerial', 'r.consumableExpirationDate', 'r.consumableLot',
      'r.instrumentSerial', 'r.moduleName', 'r.moduleSerial', 'r.id as resultId',
      'a.externalId as assayId', 'r.assayVersion',
      'r.latitude', 'r.longitude', 'rt.externalId as resultTypeId',
      'rs.externalId as resultWorkflowStatusId',
      's.externalId as sampleId', 's.collectedOn as sampleCollectedOn',
      'sos.externalId as sampleOriginSiteId', 'st.externalId as sampleTypeId',
      'rc1.externalId as category1Id', 'rc2.externalId as category2Id')

  const row = yield resultQuery
  if (row == null) {
    return null
  }

  const resultWorkflowLog = yield* getLatestResultWorkflowLog(knex, row.resultId)

  // TODO allow filtering on fields of interest, similar to client device API
  // but JSON paths from result data in same format as POST
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
  result.workflow = { status: { id: row.resultWorkflowStatusId } }
  if (resultWorkflowLog) {
    result.workflow.changedOn = resultWorkflowLog.changedOn
    if (resultWorkflowLog.operator != null) {
      result.workflow.operator = resultWorkflowLog.operator
    }
  }

  const sample = { id: row.sampleId, originSite: { id: row.sampleOriginSiteId } }
  if (row.sampleCollectedOn != null) {
    sample.collectedOn = row.sampleCollectedOn
  }
  if (row.sampleTypeId != null) {
    sample.type = { id: row.sampleTypeId }
  }
  result.sample = sample

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
    expirationDate: row.consumableExpirationDate
  }
  if (consumable.serial != null
      || consumable.lot != null
      || consumable.expirationDate != null) {
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


function* getLatestResultWorkflowLog(knex, resultId) {
  return yield knex('ResultWorkflowLog')
    .where({ resultId })
    .orderBy('createdOn', 'desc')
    .orderBy('id', 'desc')
    .first('operator', 'changedOn')
}


module.exports = {
  addResult,
  getResult
}
