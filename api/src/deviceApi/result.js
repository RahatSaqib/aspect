const Boom = require('boom')
const crypto = require('crypto')
const { transact } = require('../db')
const { getDeviceByApiKeyId } = require('./common')

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
      source: 'ResultAPI',
      // TODO Does Hapi Remote address work through proxies? Check headers?
      senderIp: request.info.remoteAddress || '',
      // TODO ResultLog handle non-JSON payloads
      rawMessage: JSON.stringify(payload)
    })

    // TODO should we update lastPingOn lastPingFromIp with Result request info?
    // TODO does device result upload change updatedOn on Device?
    // could also do this for DeviceOperation, DeviceConfiguration uploads
  })
  return resultId > 0
    ? {ok: true, data: {id: resultId}}
    : {ok: false}
}


module.exports = {
  addResult
}
