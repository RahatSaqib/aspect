const Boom = require('boom')
const _ = require('lodash')
const { transact, knex, sortPageParams } = require('../db')
const { getDeviceByApiKeyId, getExternalId } = require('./common')
const { getDeviceConstraints, addConstraints } = require('../auth/constraints')

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
    const assayQ = knex('Assay as a')
      .join('Device as d', 'a.deviceTypeId', 'd.deviceTypeId')
      .where({'d.id': deviceId})
      .first('a.id', 'a.externalId')
    const payloadAssayId = _.get(payload, 'assay.id', false)
    if(payloadAssayId){
      assayQ.where({'a.externalId': payloadAssayId})
    }

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
    // TODO handle 0 result types, sites or assays, categories found
    // TODO error if multiple assays and no assay specified

    // TODO lookup and merge specified sample
    // TODO Do we need to authorize this Device can link to Sample origin site?
    let sampleOriginSiteId = site.id
    const payloadOriginSiteId = _.get(payload, 'sample.originSite.id', false)
    if(payloadOriginSiteId){
      sampleOriginSiteId = (yield knex('Site')
        .where({partnerId: site.partnerId, externalId: payloadOriginSiteId})
        .first('id')).id
    }
    const [sampleId] = yield knex('Sample').insert({
      externalId: _.get(payload, 'sample.id', 'sample_'+externalId),
      originSiteId: sampleOriginSiteId
    })

    // TODO result data validate against assay schema
    const resultData = JSON.stringify(payload.data)

    const patientData = JSON.stringify(payload.patient)

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
        patientData,
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
    ok = true
  })
  return ok ? {ok, data: {id: externalId}} : {ok}
}

function* listResults(request){
  const {query, auth} = request
  const device = yield* getDeviceByApiKeyId(request)
  if(!device.ok){
    return Boom.unauthorized()
  }

  const dataConstraints = yield getDeviceConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .leftJoin('Site as sos', 's.originSiteId', 'sos.id')
    .modify(addConstraints, dataConstraints, {device: 'd', sample: 's'})

  // get total count for paging
  const getCount = resultQuery.clone()
    .count('r.id as count').first()

  // get rows
  const getItems = resultQuery.clone()
    .modify(sortPageParams, query, 'updatedOn')
    .select(
      'r.externalId as resultId', 'r.resultData', 'r.patientData',
      'r.startedOn', 'r.endedOn', 'r.updatedOn', 'r.researchId', 'r.notes',
      'r.senderVersion', 'r.senderOperator', 'r.errorCode', 'r.errorNotes',
      'r.consumableSerial', 'r.consumableExpirationDate', 'r.consumableLot',
      'r.instrumentSerial', 'r.moduleName', 'r.moduleSerial',
      'a.externalId as assayId', 'r.assayVersion',
      'r.latitude', 'r.longitude', 'rt.externalId as resultTypeId',
      's.externalId as sampleId', 'sos.externalId as sampleOriginSiteId',
      'rc1.externalId as category1Id', 'rc2.externalId as category2Id'
    )

  // return result when both queries are finished
  const [{count: total}, items] = yield Promise.all([getCount, getItems])
  const data = items.map(rowToResult)

  return { ok: true, total, length: data.length, data }
}

function rowToResult(row){
  // TODO allow filtering on fields of interest, similar to client device API
  // but JSON paths from result data in same format as POST
  const result = {id: row.resultId}

  result.assay = {id: row.assayId}
  if(row.assayVersion != null){
    result.assay.version = row.assayVersion
  }

  const location = {latitude: row.latitude, longitude: row.longitude}
  if(location.latitude != null || location.longitude != null){
    result.location = location
  }
  result.type = {id: row.resultTypeId}

  result.sample = {id: row.sampleId, originSite: {id: row.sampleOriginSiteId}}

  const categories = []
  if(row.category1Id !== null){
    categories.push({id: row.category1Id})
  }
  if(row.category2Id !== null){
    categories.push({id: row.category2Id})
  }
  if(categories.length > 0){
    result.category = categories
  }

  result.data = JSON.parse(row.resultData)

  if(row.startedOn != null){
    result.startedOn = row.startedOn
  }
  result.endedOn = row.endedOn

  const consumable = {
    serial: row.consumableSerial,
    lot: row.consumableLot,
    expirationDate: row.consumableExpirationDate
  }
  if(consumable.serial != null
      || consumable.lot != null
      || consumable.expirationDate != null){
    result.consumable = [consumable]
  }

  const instrument = {serial: row.instrumentSerial}
  if(instrument.serial != null){
    result.instrument = instrument
  }

  const module = {name: row.moduleName, serial: row.moduleSerial}
  if(module.name != null || module.serial != null){
    result.module = module
  }

  const research = {id: row.researchId}
  if(research.id != null){
    result.research = research
  }

  if(row.patientData != null){
    result.patient = JSON.parse(row.patientData)
  }

  const sender = {version: row.senderVersion, operator: row.senderOperator}
  if(sender.version != null || sender.operator != null){
    result.sender = sender

  }
  if(row.notes != null){
    result.notes = row.notes
  }

  const error = {code: row.errorCode, notes: row.errorNotes}
  if(error.code != null || error.notes != null){
    result.error = error
  }
  return result
}


module.exports = {
  addResult,
  listResults
}
