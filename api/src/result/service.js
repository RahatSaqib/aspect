const Promise = require('bluebird')
const Boom = require('boom')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'r.id', 'r.ended', 'd.name as deviceName', 'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name',
  's.sampleId', 'r.patientId', 'a.name as assayName'
]

const SELECT_SHOW_FIELDS = [
  'r.id', 'r.started', 'r.ended', 'd.name as deviceName', 'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name', 'r.resultData',
  's.sampleId', 'r.patientId', 'a.id as assayId',
  'a.resultCategory1Label', 'a.resultCategory1i18nKey', 'a.resultCategory2Label', 'a.resultCategory2i18nKey',
  'a.resultDataSchema', 'si.name as siteName', 'r.assayVersion', 'r.consumableSerial', 'r.consumableLot',
  'r.consumableExpirationDate', 'r.instrumentSerial', 'r.moduleName', 'r.moduleSerial', 'r.researchId',
  'r.senderVersion', 'r.senderOperator', 'r.notes', 'r.errorCode', 'r.errorNotes','r.createdOn', 'r.updatedOn'
]

// for a given schema, extracts all paths for which list=true
// and adds them to an array that can be added to SELECT_LIST_FIELDS
function extractListPaths(obj, stack, paths) {
  for (const property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (typeof obj[property] == 'object') {
        extractListPaths(obj[property], stack + '.' + property, paths)
      } else if (obj[property] == true){

        // remove properties from the path because it's only used in the
        // schema, not the resultData field
        const path = stack.replace('.properties', '')
        paths.push(knex.raw(`JSON_EXTRACT(resultData, "$${path}") as ${path.substr(path.lastIndexOf('.') + 1)}`))
      }
    }
  }
}

function* listResults(request){
  const {query, auth} = request
  let fields = SELECT_LIST_FIELDS

  // if we received an assay ID, we can also return details about
  // the schema for that assay
  let assay = {}
  if (request.query.assayId){
    assay = yield knex('Assay as a').where('a.id', request.query.assayId).first()

    if (assay.resultDataSchema){
      assay.resultDataSchema = JSON.parse(assay.resultDataSchema)
    }

    // add any JSON data that is defined in the schema as being part of a list
    let paths = []
    extractListPaths(assay.resultDataSchema, '', paths)
    fields = fields.concat(paths)
  }

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
    .select(fields)

  // return result when both queries are finished
  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data, assay }

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

  // translate result data back to an object and get assay details
  // if selecting the result was successful
  let assay = {}
  if (results.length === 1){
    results[0].resultData = JSON.parse(results[0].resultData)
    assay = yield knex('Assay as a').where('a.id', results[0].assayId).first()
    assay.resultDataSchema = JSON.parse(assay.resultDataSchema)
  }

  return { ok: results.length === 1, data: results[0], assay }
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
