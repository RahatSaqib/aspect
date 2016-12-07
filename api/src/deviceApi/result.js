const Boom = require('boom')
const _ = require('lodash')
const { getExternalId } = require('./common')
const { addConstraints } = require('../auth/constraints')

function* addResult(context) {
  const { knex, payload, constraints: dataConstraints, now } = context

  // TODO seperate permissions for device add vs update result?
  const externalId = getExternalId(payload.id)
  const existingResults = yield knex('Result as r')
    .where({ 'r.externalId': externalId })
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 's' })
    .distinct('r.*')
    .limit(2)

  if (existingResults.length > 1) {
    return Boom.badRequest()
  }
  const existingResult = existingResults[0]
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
      's.countryId', 's.stateId', 's.lgaId', 's.latitude', 's.longitude')

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
      externalId: _.get(payload, 'sample.id', `sample_${externalId}`),
      originSiteId: sampleOriginSiteId
    })
  } else {
    sampleId = existingResult.sampleId
    if (_.has(payload, 'sample')) {
      const existingSample = yield knex('Sample')
        .where({ id: sampleId })
        .first('externalId', 'originSiteId')
      yield knex('Sample')
        .where({ id: sampleId })
        .update({
          externalId: _.get(payload, 'sample.id', existingSample.externalId),
          originSiteId: payloadOriginSiteId
            ? sampleOriginSiteId
            : existingSample.originSiteId
        })
    }
  }

  // TODO result data validate against assay schema
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
      payload, 'module.serial',
      _.get(existingResult, 'moduleSerial', null)),
    moduleName: _.get(
      payload, 'module.name',
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
      externalId,
      deviceId,
      partnerId: site.partnerId,
      orgUnitId: site.orgUnitId,
      countryId: site.countryId,
      stateId: site.stateId,
      lgaId: site.lgaId,
      siteId: site.id,
      createdOn: now
    }, result))
  }

  context.addResultId(resultId)

  return { id: externalId }
}

function* listResults(context, auditLogId) {
  const { knex, constraints: dataConstraints } = context

  const authorizedResultQuery = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 's' })

  const authorizedDeviceIds = yield authorizedResultQuery.clone()
    .distinct('d.id')
    .map(d => d.id)

  const resultQuery = authorizedResultQuery.clone()
    .whereIn('d.id', authorizedDeviceIds)
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')

  if (auditLogId > 0) {
    resultQuery.whereIn('r.id',
      knex('AuditLog as al')
        .whereIn('al.deviceId', authorizedDeviceIds)
        .where('al.id', '>', auditLogId)
        .where('al.sourceAuditLogId', '<>', auditLogId)
        .where({ 'al.tableName': 'Result' })
        .distinct('al.tableId')
        .orderBy('al.id'))
  }
  // TODO limit size of result list from Device API?

  resultQuery
    .orderBy('updatedOn', 'desc')
    .select(
      'r.externalId as resultId', 'r.resultData', 'r.patientData',
      'r.startedOn', 'r.endedOn', 'r.updatedOn', 'r.researchId', 'r.notes',
      'r.senderVersion', 'r.senderOperator', 'r.errorCode', 'r.errorNotes',
      'r.consumableSerial', 'r.consumableExpirationDate', 'r.consumableLot',
      'r.instrumentSerial', 'r.moduleName', 'r.moduleSerial',
      'a.externalId as assayId', 'r.assayVersion',
      'r.latitude', 'r.longitude', 'rt.externalId as resultTypeId',
      'rs.externalId as resultWorkflowStatusId',
      's.externalId as sampleId', 'sos.externalId as sampleOriginSiteId',
      'rc1.externalId as category1Id', 'rc2.externalId as category2Id'
    )

  // return result when both queries are finished
  return yield resultQuery.map(rowToResult)
}

function rowToResult(row) {
  // TODO allow filtering on fields of interest, similar to client device API
  // but JSON paths from result data in same format as POST
  const result = { id: row.resultId }

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

  result.sample = { id: row.sampleId, originSite: { id: row.sampleOriginSiteId } }

  const categories = []
  if (row.category1Id !== null) {
    categories.push({ id: row.category1Id })
  }
  if (row.category2Id !== null) {
    categories.push({ id: row.category2Id })
  }
  if (categories.length > 0) {
    result.category = categories
  }

  result.data = JSON.parse(row.resultData)

  if (row.startedOn != null) {
    result.startedOn = row.startedOn
  }
  result.endedOn = row.endedOn

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
  if (instrument.serial != null) {
    result.instrument = instrument
  }

  const module = { name: row.moduleName, serial: row.moduleSerial }
  if (module.name != null || module.serial != null) {
    result.module = module
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


module.exports = {
  addResult,
  listResults
}
