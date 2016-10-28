const Boom = require('boom')
const crypto = require('crypto')
const { knex, transact } = require('../db')

function* getDeviceByApiKeyId(request, fields=['d.id']){
  const {auth} = request
  const devices = yield knex('DeviceApiKey as dak')
    .innerJoin('Device as d', 'dak.deviceId', 'd.id')
    .where({
      'dak.id': +auth.credentials.dak,
      'dak.revoked': false
    })
    .select(fields)
  return {ok: devices.length === 1, data: devices[0]}
}

function* addDeviceConfiguration(request){
  const {payload} = request
  const device = yield* getDeviceByApiKeyId(request)
  if(!device.ok){
    return Boom.unauthorized()
  }
  const deviceId = device.data.id

  const now = new Date()
  let deviceConfigurationId = -1

  yield transact(function*(knex){
    [deviceConfigurationId] = yield knex('DeviceConfiguration')
      .insert({
        deviceId,
        data: JSON.stringify(payload.data),
        createdOn: now
      })

    yield knex('Device')
      .where('id', deviceId)
      .update({
        deviceConfigurationId,
        updatedOn: now
      })
  })
  return deviceConfigurationId > 0
    ? {ok: true, data: {id: deviceConfigurationId}}
    : {ok: false}
}

function* addDeviceOperation(request){
  const {payload} = request
  const device = yield* getDeviceByApiKeyId(request)
  if(!device.ok){
    return Boom.unauthorized()
  }
  const deviceId = device.data.id

  const now = new Date()
  let deviceOperationId = -1

  yield transact(function*(knex){
    [deviceOperationId] = yield knex('DeviceOperation')
      .insert({
        deviceId,
        data: JSON.stringify(payload.data),
        createdOn: now
      })

    yield knex('Device')
      .where('id', deviceId)
      .update({
        deviceOperationId,
        updatedOn: now
      })
  })
  return deviceOperationId > 0
    ? {ok: true, data: {id: deviceOperationId}}
    : {ok: false}
}

function* addResult(request){
  const {payload} = request
  const device = yield* getDeviceByApiKeyId(request)
  if(!device.ok){
    return Boom.unauthorized()
  }
  const deviceId = device.data.id

  const now = new Date()
  let resultId = -1

  yield transact(function*(knex){
    // TODO lookup and reuse result with UniqueId if specified
    const uniqueId = typeof payload.uniqueId !== 'undefined'
      ? payload.uniqueId
      : crypto.randomBytes(48).toString('base64') // TODO UUID?

    // TODO handle multiple Assays per DeviceType
    const assayQ = knex('Assay as a')
      .join('Device as d', 'a.deviceTypeId', 'd.deviceTypeId')
      .where({'d.id': deviceId})
      .first('a.id')

    const siteQ = knex('Site as s')
      .join('Device as d', 's.id', 'd.siteId')
      .where({'d.id': deviceId})
      .first('s.id', 's.partnerId', 's.orgUnitId',
        's.countryId', 's.stateId', 's.lgaId', 's.latitude', 's.longitude')

    // TODO lookup specified ResultType
    const resultTypeQ = knex('ResultType as rt')
      .where({'rt.i18nKey': 'ResultTypePatient'})
      .first('rt.id')

    const [assay, site, resultType] = yield Promise.all([assayQ, siteQ, resultTypeQ])

    // TODO lookup specified sample
    // TODO allow linking to different sample origin site
    const [sampleId] = yield knex('Sample').insert({
      sampleId: 'Sample '+uniqueId,
      originSiteId: site.id
    })

    // TODO result data validate against assay schema
    const resultData = JSON.stringify(payload.data)

    // TODO result merge into existing with same uniqueId
    ;[resultId] = yield knex('Result')
      .insert({
        uniqueId,
        deviceId,
        assayId: assay.id,
        partnerId: site.partnerId,
        orgUnitId: site.orgUnitId,
        countryId: site.countryId,
        stateId: site.stateId,
        lgaId: site.lgaId,
        siteId: site.id,
        latitude: site.latitude,
        longitude: site.longitude,
        resultTypeId: resultType.id,
        sampleId,
        // TODO result categories
        resultData,
        // TODO result assayVersion
        // TODO result startedOn, endedOn
        startedOn: now,
        endedOn: now,
        // TODO result consumable serial, expiration date, lot
        // TODO result instrument serial, module name and serial,
        // TODO result researchId, patientId
        // TODO result sender version, operator
        // TODO result notes
        // TODO result error code, notes
        createdOn: now,
        updatedOn: now
      })

    yield knex('ResultLog').insert({
      resultId,
      // TODO ResultLog source, senderIp
      source: '',
      senderIp: '',
      // TODO ResultLog handle non-JSON payloads
      rawMessage: JSON.stringify(payload)
    })
  })
  return resultId > 0
    ? {ok: true, data: {id: resultId}}
    : {ok: false}
}


module.exports = {
  addDeviceConfiguration,
  addDeviceOperation,
  addResult
}
