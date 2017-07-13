const _ = require('lodash')
const Boom = require('boom')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { groupToken, randomToken } = require('../deviceApi/apiKey')

const {
  createFetch,
  base,
  accept,
  header,
  method,
  body,
} = require('http-client')

function* getDemoDevice(request) {
  const { auth, params } = request
  const { deviceId } = params

  const dataConstraints = yield getConstraints(auth.credentials)

  const device = yield knex('Device as d')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dc', 'dt.deviceTypeCategoryId', 'dc.id')
    .leftOuterJoin('User as u', 'u.id', 'd.approvedBy')
    .where('d.id', deviceId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .first('d.id', 'd.name', 'd.deviceTypeId')
  if (!device) {
    return Boom.notFound()
  }

  const access = yield* getApiKey(deviceId, dataConstraints)
  const result = { id: device.id, name: device.name, access }

  const assays = yield knex('Assay as a')
    .innerJoin('DeviceType as dt', 'dt.id', 'a.deviceTypeId')
    .where({ 'dt.id': device.deviceTypeId })
    .orderBy('a.name')
    .select('a.id', 'a.name')

  result.assays = []
  for (const assay of assays) {
    const results = yield knex('Result as r')
      .where('r.assayId', assay.id)
      .distinct(
        'id',
        knex.raw(
          'JSON_UNQUOTE(JSON_EXTRACT(resultData, "$.resultText")) as name'
        )
      )
      .orderBy('name')
      .limit(1000)
    result.assays.push(
      Object.assign({ results: _.sortedUniqBy(results, 'name') }, assay)
    )
  }

  return result
}

function* createDemoDeviceApiKey(request) {
  // FIXME Remove demo device api key once key management UI/API available
  const { auth } = request
  const now = new Date()
  const user = yield knex('Person as p')
    .join('User as u', 'u.id', 'p.userId')
    .where('u.name', auth.credentials.name)
    .first('u.id', 'p.lastPartnerId as partnerId')
  if (user == null || user.partnerId == null) {
    return Boom.badRequest('Cannot find partner for user')
  }

  const apiKey = { token: randomToken() }
  yield knex('DeviceApiKey').insert({
    token: apiKey.token,
    revoked: 0,
    partnerId: user.partnerId,
    createdOn: now,
    createdBy: user.id,
    updatedOn: now,
    updatedBy: user.id,
  })
  return apiKey
}

function* getApiKey(deviceId, userConstraints) {
  const apiKey = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({ 'd.id': +deviceId, 'dak.revoked': 0 })
    .modify(addConstraints, userConstraints, { device: 'd' })
    .first('dak.token')
  return apiKey == null ? '' : groupToken(apiKey.token)
}

function* postDemoDeviceResult(request) {
  const { auth, params, payload } = request
  const { deviceId } = params
  const { resultId } = payload

  const userConstraints = yield getConstraints(auth.credentials)
  const apiKey = yield* getApiKey(deviceId, userConstraints)
  if (!apiKey) {
    return Boom.badRequest()
  }

  const resultTemplate = yield knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .where({ 'r.id': resultId })
    .first(
      'r.resultData',
      'r.patientData',
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
      'a.externalId as assayId',
      'r.assayVersion',
      'r.latitude',
      'r.longitude',
      'rt.externalId as resultTypeId',
      'rs.externalId as resultWorkflowStatusId',
      's.externalId as sampleId',
      'sos.externalId as sampleOriginSiteId',
      'rc1.externalId as category1Id',
      'rc2.externalId as category2Id'
    )

  if (!resultTemplate) {
    return Boom.notFound()
  }

  const result = {}
  const now = new Date()

  result.assay = { id: resultTemplate.assayId }
  if (resultTemplate.assayVersion != null) {
    result.assay.version = resultTemplate.assayVersion
  }

  const location = {
    latitude: resultTemplate.latitude,
    longitude: resultTemplate.longitude,
  }
  if (location.latitude != null || location.longitude != null) {
    result.location = location
  }
  result.type = { id: resultTemplate.resultTypeId }
  result.workflow = { status: { id: resultTemplate.resultWorkflowStatusId } }

  result.sample = {
    id: resultTemplate.sampleId,
    originSite: { id: resultTemplate.sampleOriginSiteId },
  }

  const categories = []
  if (resultTemplate.category1Id !== null) {
    categories.push({ id: resultTemplate.category1Id })
  }
  if (resultTemplate.category2Id !== null) {
    categories.push({ id: resultTemplate.category2Id })
  }
  if (categories.length > 0) {
    result.category = categories
  }

  result.data = JSON.parse(resultTemplate.resultData)
  result.endedOn = now

  const consumable = {
    serial: resultTemplate.consumableSerial,
    lot: resultTemplate.consumableLot,
    expirationDate: resultTemplate.consumableExpirationDate,
  }
  if (
    consumable.serial != null ||
    consumable.lot != null ||
    consumable.expirationDate != null
  ) {
    result.consumable = [consumable]
  }

  const instrument = { serial: resultTemplate.instrumentSerial }
  const module = {
    name: resultTemplate.moduleName,
    serial: resultTemplate.moduleSerial,
  }
  if (module.name != null || module.serial != null) {
    instrument.module = module
  }

  if (instrument.serial != null || instrument.module != null) {
    result.instrument = instrument
  }

  const research = { id: resultTemplate.researchId }
  if (research.id != null) {
    result.research = research
  }

  if (resultTemplate.patientData != null) {
    result.patient = JSON.parse(resultTemplate.patientData)
  }

  const sender = {
    version: resultTemplate.senderVersion,
    operator: resultTemplate.senderOperator,
  }
  if (sender.version != null || sender.operator != null) {
    result.sender = sender
  }
  if (resultTemplate.notes != null) {
    result.notes = resultTemplate.notes
  }

  const error = {
    code: resultTemplate.errorCode,
    notes: resultTemplate.errorNotes,
  }
  if (error.code != null || error.notes != null) {
    result.error = error
  }

  const deviceApiFetch = createFetch(
    method('POST'),
    base(`http://localhost:${request.server.info.port}`),
    accept('application/json'),
    header('Content-Type', 'application/json'),
    header('Authorization', `Bearer ${apiKey}`),
    body(JSON.stringify({ result }), 'application/json')
  )

  const resp = yield deviceApiFetch('/device')
  const respJson = yield resp.json()
  return resp.ok
    ? respJson
    : Boom.create(+resp.status || 500, JSON.stringify(respJson))
}

module.exports = {
  getDemoDevice,
  createDemoDeviceApiKey,
  postDemoDeviceResult,
}
