const Promise = require('bluebird')
const Boom = require('boom')
const _ = require('lodash')
const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'r.id', 'r.endedOn', 'd.name as deviceName', 'c.name as countryName',
  'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name',
  's.sampleId', 'r.patientId', 'a.name as assayName'
]

const SELECT_SHOW_FIELDS = [
  'r.id', 'r.startedOn', 'r.endedOn', 'd.name as deviceName', 'c.name as countryName',
  'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name', 'r.resultData',
  's.sampleId', 'r.patientId','si.name as siteName', 'r.assayVersion', 'r.consumableSerial',
  'r.consumableLot', 'r.consumableExpirationDate', 'r.instrumentSerial', 'r.moduleName',
  'r.moduleSerial', 'r.researchId', 'r.senderVersion', 'r.senderOperator', 'r.notes',
  'r.errorCode', 'r.errorNotes','r.createdOn', 'r.updatedOn', 'r.assayId'
]

const SORT_FIELDS = [
  'endedOn', 'deviceName', 'stateName', 'lgaName', 'sampleId', 'patientId', 'resultCategory1Name', 'resultCategory2Name'
]

function* listResults(request){
  const { query, auth } = request
  let selectFields = _.clone(SELECT_LIST_FIELDS)
  let sortableFields = _.clone(SORT_FIELDS)

  let assayColumns = []
  if (query.assayId){

    const [assay] = yield knex('Assay as a').where('a.id', query.assayId)

    if (assay.resultCategory1Label){
      selectFields.push('rc1.name as resultCategory1Name')
      sortableFields.push('resultCategory1Name')
      assayColumns.push({
        db: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey })
    }

    if (assay.resultCategory2Label){
      selectFields.push('rc2.name as resultCategory2Name')
      sortableFields.push('resultCategory2Name')
      assayColumns.push({
        db: 'resultCategory2Name',
        type: 'string',
        title: assay.resultCategory2Label,
        i18nKey: assay.resultCategory2i18nKey })
    }

    const resultDataSchema = JSON.parse(assay.resultDataSchema)
    _.each(resultDataSchema, (value, key) => {
      if (value.list){
        selectFields.push(knex.raw('JSON_EXTRACT(resultData, ?) as ?', [`$.${key}`, key.replace('.', '_')]))

        sortableFields.push(key.replace('.', '_'))

        assayColumns.push({
          db: key.replace('.', '_'),
          type: value.type,
          title: value.title,
          i18nKey: value.i18nKey })
      }
    })
  }

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)){
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Country as c', 'r.countryId', 'c.id')
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
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)

  // return result when both queries are finished
  const [{count: total}, data] = yield Promise.all([getCount, getItems])

  // if any json fields requested, parse them
  if (request.query.jsonFields){
    _.each(data, (d) => {
      _.each(request.query.jsonFields, (f) => {
        if (f){
          const path = f.replace('.', '_')
          _.set(d, path, JSON.parse(d[path]))
        }
      })
    })
  }

  const result = { ok: true, total, length: data.length, data, extraColumns: assayColumns }

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
  const { query } = request

  const resultTypeQuery = knex('ResultType as rt')
    .modify(filterParams, query, { 'name': 'rt.name' })

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
