const subDays = require('date-fns/subDays')
const addDays = require('date-fns/addDays')
const startOfDay = require('date-fns/startOfDay')
const _ = require('lodash')
const { startOfDayUtc } = require('../shared/date')
const { resultCategoryToId } = require('../shared/dictionary')

const analyzeResultsWithErrors = (
  resultsWithErrors,
  totalResults,
  threshold,
  below,
  minResults
) => {
  const percentage = resultsWithErrors / parseFloat(totalResults)
  return (
    resultsWithErrors >= minResults &&
    (below ? percentage <= threshold : percentage >= threshold)
  )
}
async function analyzeWithQuery(
  knex,
  action,
  threshold,
  below,
  daysPeriod,
  minResults,
  queryBuilder
) {
  const instrumentSerial = _.get(action.options.data, 'instrumentSerial')

  const query = knex('Result')
    .where('endedOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
    .andWhere('deviceId', action.deviceId)
    .modify((builder, instrumentSerial) => {
      if (instrumentSerial) builder.where({ instrumentSerial })
    }, instrumentSerial)
  if (queryBuilder) {
    query.modify(queryBuilder)
  }
  const { resultsWithErrors, totalResults } = await query
  action.options.data.resultsWithErrors = resultsWithErrors
  action.options.totalResults = totalResults
  return analyzeResultsWithErrors(
    resultsWithErrors,
    totalResults,
    threshold,
    below,
    minResults
  )
}

async function analyzeCategories(
  knex,
  action,
  { categoryId, errorCodes, threshold, below, daysPeriod, minResults }
) {
  const categoryToCompare = await resultCategoryToId(categoryId)

  const { resultCategoryId, resultErrorCode } = action.options.data

  if (
    (!_.isNil(resultCategoryId) && resultCategoryId === categoryId) ||
    (!_.isNil(resultErrorCode) &&
      _.includes(errorCodes, parseInt(resultErrorCode, 10)))
  ) {
    action.options.data.errorCodes = errorCodes
    return analyzeWithQuery(
      knex,
      action,
      threshold,
      below,
      daysPeriod,
      minResults,
      builder =>
        builder.first(
          knex.raw(
            `sum(case when resultCategory1=? ${
              errorCodes && errorCodes.length > 0
                ? ` OR errorcode in(${errorCodes.join(',')})`
                : ``
            } then 1 else 0 end) as resultsWithErrors, count(id) as totalResults`,
            categoryToCompare
          )
        )
    )
  }
  return false
}

function hasUnusedModules(
  numberOfResults,
  numberOfModules,
  minResults,
  expectedUsedModules
) {
  if (
    (!numberOfResults && numberOfResults !== 0) ||
    (!numberOfModules && numberOfModules !== 0)
  )
    throw new Error(
      "numberOfResults and numberOfModules can't be null or undefined"
    )

  return numberOfResults >= minResults && numberOfModules < expectedUsedModules
}

async function analyzeUnusedModules(
  knex,
  action,
  { minResults, expectedUsedModules }
) {
  const { deviceId } = action

  const { numberOfResults, numberOfModules } = await knex('Result as r')
    .where('r.endedOn', '>', startOfDay(addDays(new Date(), -30)))
    .andWhere('r.deviceId', deviceId)
    .select(
      knex.raw('COUNT(*) as numberOfResults'),
      knex.raw('COUNT(DISTINCT r.moduleName) as numberOfModules')
    )
    .first()

  return hasUnusedModules(
    numberOfResults,
    numberOfModules,
    minResults,
    expectedUsedModules
  )
}

async function analyzeErrors(
  knex,
  action,
  { errorCodes, threshold, below, daysPeriod, minResults }
) {
  const { resultErrorCode } = action.options.data
  if (_.includes(errorCodes, parseInt(resultErrorCode, 10))) {
    action.options.data.errorCodes = errorCodes
    return analyzeWithQuery(
      knex,
      action,
      threshold,
      below,
      daysPeriod,
      minResults,
      builder =>
        builder.first(
          knex.raw(
            `sum(case when errorcode in(${errorCodes.join(
              ','
            )}) then 1 else 0 end) as resultsWithErrors, count(id) as totalResults`
          )
        )
    )
  }
  return false
}

async function analyzeDeviceHardwareError(
  knex,
  action,
  { errorCodes, daysPeriod, minErrors }
) {
  const { errorCode: actualErrorCode } = action.options.data
  if (_.includes(errorCodes, parseInt(actualErrorCode, 10))) {
    const query = knex('DeviceOperation')
      .where('startedOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
      .where('deviceId', action.deviceId)
      .select(
        knex.raw(
          `
          SUM(
            CASE WHEN
              IFNULL(data ->> '$.type', '') = 'gx-log'
              AND
              CAST( IFNULL(data ->> '$.details.Errors[0].ErrorCode', 0) AS UNSIGNED ) in (${errorCodes.join(
                ','
              )})
            THEN 1
            ELSE 0
            END
          ) AS totalErrors
          `
        )
      )

    const [{ totalErrors }] = await query
    action.options.data.totalErrors = totalErrors

    return totalErrors >= minErrors
  }
  return false
}

module.exports = {
  analyzeErrors,
  analyzeResultsWithErrors,
  analyzeCategories,
  analyzeUnusedModules,
  hasUnusedModules,
  analyzeDeviceHardwareError,
}
