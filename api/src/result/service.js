const Promise = require('bluebird')
const Boom = require('boom')
const _ = require('lodash')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'r.id', 'r.ended', 'd.name as deviceName', 'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name',
  's.sampleId', 'r.patientId', 'a.name as assayName'
]

const SELECT_SHOW_FIELDS = [
  'r.id', 'r.started', 'r.ended', 'd.name as deviceName', 'c.name as countryName',
  'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name', 'r.resultData',
  's.sampleId', 'r.patientId','si.name as siteName', 'r.assayVersion', 'r.consumableSerial',
  'r.consumableLot', 'r.consumableExpirationDate', 'r.instrumentSerial', 'r.moduleName',
  'r.moduleSerial', 'r.researchId', 'r.senderVersion', 'r.senderOperator', 'r.notes',
  'r.errorCode', 'r.errorNotes','r.createdOn', 'r.updatedOn', 'r.assayId'
]

function* listResults(request){
  const {query, auth} = request
  let selectFields = _.clone(SELECT_LIST_FIELDS)

  // did the client request specific selectFields from
  // the resultData JSON column?
  _.each(request.query.jsonFields, (f) => {
    if (f){
      selectFields.push(knex.raw(`JSON_EXTRACT(resultData, "$.${f}") as ${f.replace('.', '_')}`))
    }
  })

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('State as st', 'r.stateId', 'st.id')
    .leftJoin('Lga as lg', 'r.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .modify(filterParams, query, {  sampleId: 's.sampleId', assayId: 'r.assayId' })
    .modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  const getCount = resultQuery.clone()
    .count('r.id as count').first()

  // get rows
  const getItems = resultQuery.clone()
    .modify(sortPageParams, query, 'ended')
    .select(selectFields)

  // return result when both queries are finished
  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

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
    .leftJoin('Country as c', 'r.countryId', 'c.id')
    .leftJoin('State as st', 'r.stateId', 'st.id')
    .leftJoin('Lga as lg', 'r.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as s', 'r.sampleId', 's.id')
    .where('r.id', + params.resultId)
    .modify(addConstraints, dataConstraints, {device: 'd'})
    .select(fields)

  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1){
    results[0].resultData = JSON.parse(results[0].resultData)
    results[0].assay = yield knex('Assay as a').where('a.id', results[0].assayId).first()
    results[0].assay.resultDataSchema = JSON.parse(results[0].assay.resultDataSchema)
  }

  return { ok: results.length === 1, data: results[0] }
}

function* listResultTypes(request){
  const {query, auth} = request

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const resultTypeQuery = knex('ResultType as rt')
    .modify(filterParams, query, { 'name': 'rt.name'})
    .modify(addConstraints, dataConstraints, {device: 'd'})

  // get total count for paging
  const getCount = resultTypeQuery.clone()
    .count('rt.id as count').first()

  // get rows
  const getItems = resultTypeQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select('id','name')

  // return result when both queries are finished
  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  const result = {ok: true, total, length: data.length, data}

  return result
}

module.exports = {
  listResults,
  showResult,
  listResultTypes
}
