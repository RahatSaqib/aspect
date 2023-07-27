const _ = require('lodash')
const crypto = require('crypto')
const Boom = require('@hapi/boom')
const { isJson, deepMerge } = require('../../shared/json')
const { GRAPH_FLAGS } = require('../../shared/constants')
const {
  processGroupedQuery,
  getClinicalIndicatorQueryForFactTable,
  getClinicalIndicatorQueryForResultsTable,
} = require('./db')
const { canViewResults, getConstraints } = require('../../auth/constraints')

const plainToDeepObjectResult = result => {
  if (!result) return null

  const r = { ...result }

  if (typeof result.patientData === 'string') r.patientData = JSON.parse(result.patientData)

  if (typeof result.resultData === 'string') r.resultData = JSON.parse(result.resultData)

  return r
}

const getMissingResultValues = (result, sources) => {
  const deepResult = plainToDeepObjectResult(result)
  const missingSources = sources.filter(src => {
    const value = _.get(deepResult, src)
    return !value
  })
  return missingSources
}

const sanitizeResultData = obj => {
  const names = _.keys(obj)
  // sort all props by name
  names.sort()
  const objSortedByPropNames = _.reduce(
    names,
    (acc, propName) => {
      // remove all `date` props because they differ because of timezone shifts
      if (['testEndedOn', 'testStartedOn', 'messageSentOn', 'cartridgeExpirationDate'].includes(propName)) {
        return acc
      }
      let value = obj[propName]
      if (_.isPlainObject(value)) {
        value = sanitizeResultData(value)
      } else if (_.isArray(value)) {
        value = _.map(value, item => {
          if (_.isPlainObject(item)) {
            return sanitizeResultData(item)
          }
          return item
        })
      }
      acc[propName] = value
      return acc
    },
    {}
  )
  return objSortedByPropNames
}

const getResultDataHash = obj => {
  const objSanitized = sanitizeResultData(obj)
  const objHash = crypto.createHash('md5').update(JSON.stringify(objSanitized)).digest('hex')
  return objHash
}

const mergeResultWithPayload = (existingResult, payload) => {
  const existingResultDataString = _.get(existingResult, 'resultData', null)
  const existingResultDataHash = _.get(existingResult, 'resultDataHash', null)
  const existingResultData = isJson(existingResultDataString) ? JSON.parse(existingResultDataString) : {}
  const resultData = payload.data ? deepMerge({ ...existingResultData }, payload.data) : existingResultData

  /**
   * get hash of new resultData and if it is the same as already saved `resultDataHash` then
   * skip ResultUpdated notification because we already processed it
   */
  const resultDataHash = payload.data ? getResultDataHash(resultData) : null
  const shouldTriggerResultNotification =
    // send notification if Result.resultData is null
    !existingResultDataString ||
    // send notification if Result.resultDataHash is null
    !existingResultDataHash ||
    // send notification if Result.resultDataHash is NOT equal new resultDataHash from payload
    (!!resultDataHash && existingResultDataHash !== resultDataHash)

  return { resultData, resultDataHash, shouldTriggerResultNotification }
}

async function clinicalIndicatorAggregations(request) {
  const { auth, query } = request

  if (!canViewResults(auth)) {
    throw Boom.forbidden('You do not have access to results')
  }

  let assay = null
  if (query.assay && !Array.isArray(query.assay)) {
    assay = [query.assay]
  } else if (query.assay) {
    assay = query.assay
  }

  // if no group is specified, use result category
  const groupBy = getGroupBy(query)

  // optional flags
  let flags = []
  if (query.flags) {
    flags = _.isArray(query.flags) ? query.flags : [query.flags]
  }

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  // if grouping only by month and assay, resultCategory1, resultCategory2 (the most common case),
  // we can query the fact tables for much better performance
  const factTableDataGroups = ['year', 'month', 'assay', 'resultCategory1', 'resultCategory2']

  const resp = {}
  if (_.every(groupBy, group => _.includes(factTableDataGroups, group))) {
    const factTableQuery = getClinicalIndicatorQueryForFactTable(dataConstraints, assay, groupBy, query)

    if (flags.includes(GRAPH_FLAGS.GET_TOTAL_RESULTS)) {
      const [{ cnt }] = await factTableQuery.clone()
      resp.totalResults = cnt
    }

    resp.data = await processGroupedQuery(factTableQuery, groupBy, 'r.startedOn')
    return resp
  }

  const resultQuery = getClinicalIndicatorQueryForResultsTable(dataConstraints, assay, groupBy, query)

  if (flags.includes(GRAPH_FLAGS.GET_TOTAL_RESULTS)) {
    const [{ cnt }] = await resultQuery.clone()
    resp.totalResults = cnt
  }

  resp.data = await processGroupedQuery(resultQuery, groupBy)
  return resp
}

function getGroupBy(query) {
  if (!query.groupBy) {
    // if no group is specified, use result category
    return ['resultCategory1']
  }
  if (!_.isArray(query.groupBy)) {
    return [query.groupBy]
  }
  return query.groupBy
}

module.exports = {
  plainToDeepObjectResult,
  getMissingResultValues,
  mergeResultWithPayload,
  clinicalIndicatorAggregations,
  getGroupBy,
}
