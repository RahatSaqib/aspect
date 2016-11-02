const Boom = require('boom')
const _ = require('lodash')
const { transact } = require('../db')
const { getDeviceByApiKeyId, getExternalId } = require('./common')

function* addResult(request){
  const {payload} = request
  const device = yield* getDeviceByApiKeyId(request)
  if(!device.ok){
    return Boom.unauthorized()
  }
  const deviceId = device.data.id

  const now = new Date()
  const externalId = getExternalId(payload.id)
  let ok = false

  yield transact(function*(knex){
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

    // Select ResultType if specified, otherwise Patient
    const resultTypeQ = knex('ResultType as rt')
      .where({'rt.externalId': _.get(payload, 'type.id', 'Patient')})
      .first('rt.id')

    // Categories if specified, otherwise Error or Success depending on error payload
    let categoryIds = _.compact(_.map(payload.category, 'id'))
    if(categoryIds.length === 0){
      categoryIds = [payload.error ? 'Error' : 'Success']
    }
    const categoryQ  = knex('ResultCategory as rc')
      .whereIn('rc.externalId', categoryIds)
      .select('rc.id')

    const [assay, site, resultType, categories] = yield Promise.all(
      [assayQ, siteQ, resultTypeQ, categoryQ])
    // TODO handle 0 result types, sites or assays, cateogories found

    // TODO lookup specified sample
    // TODO allow linking to different sample origin site
    const [sampleId] = yield knex('Sample').insert({
      externalId: 'sample_'+externalId,
      originSiteId: site.id
    })

    // TODO result data validate against assay schema
    const resultData = JSON.stringify(payload.data)

    // TODO result merge into existing with same uniqueId
    const [resultId] = yield knex('Result')
      .insert({
        externalId,
        deviceId,
        partnerId: site.partnerId,
        orgUnitId: site.orgUnitId,
        countryId: site.countryId,
        stateId: site.stateId,
        lgaId: site.lgaId,
        siteId: site.id,
        latitude: _.get(payload, 'location.latitude', site.latitude),
        longitude: _.get(payload, 'location.longitude', site.longitude),
        assayId: assay.id,
        assayVersion: _.get(payload, 'assay.version', null),
        resultTypeId: resultType.id,
        sampleId,
        resultCategory1: _.get(categories, '[0].id', null),
        resultCategory2: _.get(categories, '[1].id', null),
        resultData,
        startedOn: _.get(payload, 'startedOn', null),
        endedOn: _.get(payload, 'endedOn', now),
        consumableSerial: _.get(payload, 'consumable[0].serial', null),
        consumableExpirationDate: _.get(payload, 'consumable[0].expirationDate', null),
        consumableLot: _.get(payload, 'consumable[0].lot', null),
        instrumentSerial: _.get(payload, 'instrument.serial', null),
        moduleSerial: _.get(payload, 'module.serial', null),
        moduleName: _.get(payload, 'module.name', null),
        researchId: _.get(payload, 'research.id', null),
        patientId: _.get(payload, 'patient.id', null),
        senderVersion: _.get(payload, 'sender.version', null),
        senderOperator: _.get(payload, 'sender.operator', null),
        notes: _.get(payload, 'notes', null),
        errorCode: _.get(payload, 'error.code', null),
        errorNotes: _.get(payload, 'error.notes', null),
        createdOn: now,
        updatedOn: now
      })

    // TODO ResultLog should be stored even if validation or result parsing fails
    // And should contain the RAW payload (prior to transformation during Joi Validation)
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
    ok = true
  })
  return ok ? {ok, data: {id: externalId}} : {ok}
}


module.exports = {
  addResult
}
