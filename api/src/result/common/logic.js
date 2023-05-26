const _ = require('lodash')
const crypto = require('crypto')
const { isJson, deepMerge } = require('../../shared/json')

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

module.exports = {
  plainToDeepObjectResult,
  getMissingResultValues,
  mergeResultWithPayload,
}
