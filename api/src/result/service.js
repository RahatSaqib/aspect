const Promise = require('bluebird')
const Boom = require('boom')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'r.id', 'r.ended', 'd.name as deviceName', 'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name',
  's.sampleId', 'r.patientId', 'r.resultText'
]

const SELECT_SHOW_FIELDS = [
  'r.id', 'r.started', 'r.ended', 'd.name as deviceName', 'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name', 'r.resultData',
  's.sampleId', 'r.patientId', 'r.resultText', 'a.name as assayName', 'a.i18nKey as assayNameI18n',
  'a.resultCategory1Label', 'a.resultCategory1i18nKey', 'a.resultCategory2Label', 'a.resultCategory2i18nKey',
  'a.resultDataSchema', 'si.name as siteName', 'r.assayVersion', 'r.consumableSerial', 'r.consumableLot',
  'r.consumableExpirationDate', 'r.instrumentSerial', 'r.moduleName', 'r.moduleSerial', 'r.researchId',
  'r.senderVersion', 'r.senderOperator', 'r.notes', 'r.errorCode', 'r.errorNotes','r.createdOn', 'r.updatedOn'
]

function* listResults(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let resultQuery = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('State as st', 'r.stateId', 'st.id')
    .leftJoin('Lga as lg', 'r.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .modify(filterParams, query, {  sampleId: 's.sampleId' })
    .modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  let getCount = resultQuery.clone()
    .count('r.id as count').first()

  // get rows
  let getItems = resultQuery.clone()
    .modify(sortPageParams, query, 'ended')
    .select(SELECT_LIST_FIELDS)

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = { ok: true, total, length: data.length, data }

  return result
}

function* showResult(request) {
  const result = yield* getResultByResultId(request)
  return result.ok ? result : Boom.notFound()
}

function* getResultByResultId(request, fields=SELECT_SHOW_FIELDS){
  const {auth, params} = request
  const dataConstraints = yield getConstraints(auth.credentials)

  const results = yield knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('State as st', 'r.stateId', 'st.id')
    .leftJoin('Lga as lg', 'r.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .where('r.id', + params.resultId)
    .modify(addConstraints, dataConstraints, {device: 'd'})
    .select(fields)
  return {ok: results.length === 1, data: results[0]}
}

function* listResultTypes(request){
  let {query, auth} = request

  // get data constraints
  let dataConstraints = yield getConstraints(auth.credentials)

  let resultTypeQuery = knex('ResultType as rt')
    .modify(filterParams, query, { 'name': 'rt.name'})
    //.modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  let getCount = resultTypeQuery.clone()
    .count('rt.id as count').first()

  // get rows
  let getItems = resultTypeQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select('id','name')

  // return result when both queries are finished
  let [{count: total}, data] = yield Promise.all([getCount, getItems])

  let result = {ok: true, total, length: data.length, data}

  return result
}

module.exports = {
  listResults,
  showResult,
  listResultTypes
}
