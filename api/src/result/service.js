const Promise = require('bluebird')
const Boom = require('boom')
const _ = require('lodash')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const SELECT_LIST_FIELDS = [
  'r.id', 'r.externalId', 'r.endedOn', 'd.name as deviceName',
  'c.name as countryName', 'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name',
  'rs.name as resultWorkflowStatus', 'so.name as sampleOriginSiteName',
  'sp.externalId as sampleId', 'sp.group as sampleGroup',
  'a.name as assayName', 'a.id as assayId', 'r.deviceId',
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId')
]

const SELECT_SHOW_FIELDS = [
  'r.id', 'r.externalId', 'r.startedOn', 'r.endedOn', 'r.deviceId', 'd.name as deviceName',
  'c.name as countryName', 'st.name as stateName', 'lg.name as lgaName',
  'rc1.name as resultCategory1Name', 'rc2.name as resultCategory2Name',
  'r.resultWorkflowStatusId', 'rs.name as resultWorkflowStatus',
  'r.resultData', 'r.siteId', 'si.name as siteName', 'r.assayVersion',
  'r.consumableSerial', 'r.consumableLot', 'r.consumableExpirationDate', 'r.instrumentSerial',
  'r.moduleName', 'r.moduleSerial', 'r.researchId', 'r.senderVersion', 'r.senderOperator',
  'r.notes', 'r.errorCode', 'r.errorNotes', 'r.createdOn', 'r.updatedOn', 'r.assayId',
  'sp.externalId as sampleId', 'sp.group as sampleGroup',
  'sp.originSiteId as sampleOriginSiteId', 'so.name as sampleOriginSiteName',
  knex.raw('JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'), 'r.patientData',
  'r.deliverToTerminal'
]

const SORT_FIELDS = [
  'endedOn', 'deviceName', 'sampleOriginSiteName', 'stateName', 'lgaName', 'sampleId', 'patientId', 'resultCategory1Name', 'resultCategory2Name', 'sampleGroup'
]

function* listResults(request) {
  const { query, auth } = request
  const selectFields = _.clone(SELECT_LIST_FIELDS)
  const sortableFields = _.clone(SORT_FIELDS)

  const assayColumns = []
  if (query.assayId) {
    const assay = yield knex('Assay as a').where('a.id', query.assayId).first()

    if (assay.resultCategory1Label) {
      selectFields.push('rc1.name as resultCategory1Name')
      sortableFields.push('resultCategory1Name')
      assayColumns.push({
        db: 'resultCategory1Name',
        type: 'string',
        title: assay.resultCategory1Label,
        i18nKey: assay.resultCategory1i18nKey })
    }

    if (assay.resultCategory2Label) {
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
      if (value.list) {
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
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  // get data constraints
  const dataConstraints = yield getConstraints(auth.credentials)

  const resultQuery = knex('Result as r')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .leftJoin('Site as sr', 'r.siteId', 'sr.id')
    .modify(filterDateRangeParams, query, 'r.endedOn')
    .modify(filterParams, query, {
      deviceId: 'd.id',
      assayId: 'r.assayId',
      resultCategoryId: 'r.resultCategory1',
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      deviceName: 'd.name',
      siteName: 'sr.name',
      sampleId: 'sp.externalId',
      sampleOriginSite: 'so.name',
      sampleGroup: 'sp.group',
      workflowStatusId: 'r.resultWorkflowStatusId'
    })
    .modify((queryBuilder, params) => {
      if (params.patientOrResearchId) {
        queryBuilder.whereRaw('JSON_EXTRACT(r.patientData, "$.id") like ?', [`%${params.patientOrResearchId}%`])
          .orWhere('r.researchId', 'like', `%${params.patientOrResearchId}%`)
      }
    }, query)
    .modify(addConstraints, dataConstraints, { device: 'd', sample: 's' })

  // get total count for paging
  const getCount = resultQuery.clone()
    .count('r.id as count').first()

  // get rows
  const getItems = resultQuery.clone()
    .modify(sortPageParams, query, 'endedOn')
    .select(selectFields)

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  // if assay specified columns from the resultData field, parse them to valid JSON
  if (assayColumns) {
    _.each(data, (d) => {
      _.each(assayColumns, (c) => {
        if (c && c.db.indexOf('resultCategory') === -1) {
          const path = c.db.replace('.', '_')
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

function* getResultByResultId(request, fields = SELECT_SHOW_FIELDS) {
  const { auth, params } = request
  const dataConstraints = yield getConstraints(auth.credentials)

  const results = yield knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Site as si', 'r.siteId', 'si.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
    .leftJoin('ResultWorkflowStatus as rs', 'r.resultWorkflowStatusId', 'rs.id')
    .where('r.id', +params.resultId)
    .modify(addConstraints, dataConstraints, { device: 'd' })
    .select(fields)

  let data = null

  // translate result data back to an object and get assay details
  // if selecting the result was successful
  if (results.length === 1) {
    data = results[0]
    data.resultData = JSON.parse(data.resultData)
    data.patientData = JSON.parse(data.patientData)
    data.assay = yield knex('Assay as a').where('a.id', data.assayId).first()
    data.assay.resultDataSchema = JSON.parse(data.assay.resultDataSchema)
    data.assay.patientDataSchema = JSON.parse(data.assay.patientDataSchema)
  }

  return { ok: results.length === 1, data }
}

function* listResultTypes(request) {
  const { query } = request

  const resultTypeQuery = knex('ResultType as rt')
    .modify(filterParams, query, { name: 'rt.name' })

  // get total count for paging
  const getCount = resultTypeQuery.clone()
    .count('rt.id as count').first()

  // get rows
  const getItems = resultTypeQuery.clone()
    .modify(sortPageParams, query, 'name')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function* updateWorkflowStatus(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = auth.credentials

  // get the result so we can check access and if status changed
  const result = yield* getResultByResultId(request)
  if (!result.ok) {
    Boom.notFound()
  }

  let resultWorkflowStatusId = payload.resultWorkflowStatusId
  // check if a externalId is provided
  if (payload.externalId) {
    [resultWorkflowStatusId] = yield knex('ResultWorkflowStatus as rs')
      .where('rs.externalId', payload.externalId)
      .select('rs.id')
      .limit(1)
      .map(row => row.id)

    if (!resultWorkflowStatusId) {
      return Boom.badRequest('Invalid ResultWorkflowStatus ID')
    }
  }

  // update the resultWorkflowStatusId.
  if (resultWorkflowStatusId !== result.data.resultWorkflowStatusId) {
    yield knex('Result')
      .where('id', resultId)
      .update({
        resultWorkflowStatusId,
        updatedBy: currentUserId,
        updatedOn: now
      })

    yield knex('ResultWorkflowLog').insert({
      resultId,
      resultWorkflowStatusId,
      createdBy: currentUserId,
      changedOn: now,
      createdOn: now
    })

    // if set to "validated", set "deliverToTerminal"
    // TODO: Add to MQ for processing
    if (payload.externalId === 'Validated') {
      yield knex('Result')
      .where('id', resultId)
      .update({
        deliverToTerminal: 1,
        updatedBy: currentUserId,
        updatedOn: now
      })

      // add device log entry so result is redelivered
      yield* deliverResultToTerminal(result.data.deviceId, resultId, now)
    }
  }

  return yield* showResult(request)
}

function* updateDeliverToTerminal(request) {
  const { auth, params, payload } = request
  const now = new Date()
  const { resultId } = params
  const { id: currentUserId } = auth.credentials

  // get the result so we can check access
  const result = yield* getResultByResultId(request)
  if (!result.ok) {
    Boom.notFound()
  }

  // update the result deliver to terminal flag
  yield knex('Result')
    .where('id', resultId)
    .update({
      deliverToTerminal: payload.deliverToTerminal,
      updatedBy: currentUserId,
      updatedOn: now
    })

  // add device log entry so result is redelivered
  yield* deliverResultToTerminal(result.data.deviceId, resultId, now)

  return yield* showResult(request)
}

function* deliverResultToTerminal(deviceId, resultId, createdOn) {
  yield knex('DeviceLog').insert({
    deviceId,
    resultId,
    source: 'ClientAPI',
    createdOn,
    senderIp: '',
    rawMessage: JSON.stringify({ deliverToTerminal: 1 })
  })
}

function* listWorkflowStatusTypes() {
  const resultQuery = knex('ResultWorkflowStatus as rs')

  // get total count for paging
  const getCount = resultQuery.clone()
    .count('rs.id as count').first()

  // get rows
  const getItems = resultQuery.clone()
    .orderBy('id', 'asc')
    .select('id', 'name')

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

function* listWorkflowStatusLog(request) {
  const result = yield* getWorkflowStatusLogByResultId(request)
  return result.ok ? result : Boom.notFound()
}

function* getWorkflowStatusLogByResultId(request) {
  const { query, params } = request

  const selectFields = [
    'log.id', 'log.operator', 'log.changedOn', 'log.createdOn', 'log.createdBy',
    'rs.name as statusName', 'rs.i18nKey', 'rs.externalId'
  ]
  const sortableFields = [
    'operator', 'changedOn', 'statusName'
  ]

  // now we know if the sort that was passed is valid:
  if (query.sortCol && !sortableFields.includes(query.sortCol)) {
    return Boom.badRequest()
  }

  const resultQuery = knex('ResultWorkflowLog as log')
      .innerJoin('ResultWorkflowStatus as rs', 'log.resultWorkflowStatusId', 'rs.id')
      .where('log.resultId', +params.resultId)

  // get total count for paging
  const getCount = resultQuery.clone()
    .count('log.id as count').first()

  // get rows
  const getItems = resultQuery.clone()
    .modify(sortPageParams, query, 'changedOn')
    .select(selectFields)

  // return result when both queries are finished
  const [{ count: total }, data] = yield Promise.all([getCount, getItems])

  const result = { ok: true, total, length: data.length, data }

  return result
}

module.exports = {
  listResults,
  showResult,
  listResultTypes,
  updateWorkflowStatus,
  updateDeliverToTerminal,
  listWorkflowStatusTypes,
  listWorkflowStatusLog
}
