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
  const moduleSerial = _.get(action.options.data, 'moduleSerial')
  const consumableLot = _.get(action.options.data, 'consumableLot')
  const assayId = _.get(action.options.data, 'assayId')

  const query = knex('Result')
    .where('endedOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
    .andWhere('deviceId', action.deviceId)
    .modify(
      (builder, moduleSerial, consumableLot, assayId) => {
        if (moduleSerial) builder.where({ moduleSerial })
        else builder.where({ consumableLot, assayId })
      },
      moduleSerial,
      consumableLot,
      assayId
    )
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
  { categoryId, threshold, below, daysPeriod, minResults }
) {
  const categoryToCompare = await resultCategoryToId(categoryId)

  const { resultCategoryId } = action.options.data
  const categoryReceivedId = await resultCategoryToId(resultCategoryId)
  if (categoryReceivedId === categoryToCompare)
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
            'sum(case when resultCategory1=? then 1 else 0 end) as resultsWithErrors, count(id) as totalResults',
            categoryToCompare
          )
        )
    )
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
  { errorCode, threshold, below, daysPeriod, minResults }
) {
  const { resultErrorCode } = action.options.data
  if (parseInt(resultErrorCode, 10) === errorCode) {
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
            'sum(case when errorcode=? then 1 else 0 end) as resultsWithErrors, count(id) as totalResults',
            resultErrorCode
          )
        )
    )
  }
  return false
}
module.exports = {
  analyzeErrors,
  analyzeResultsWithErrors,
  analyzeCategories,
  analyzeUnusedModules,
  hasUnusedModules,
}
