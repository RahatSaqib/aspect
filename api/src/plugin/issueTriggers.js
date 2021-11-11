const subDays = require('date-fns/subDays')
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
  const moduleSerial = _.get(action, 'options.data.moduleSerial')
  const consumableLot = _.get(action, 'options.data.consumableLot')
  const assayId = _.get(action, 'options.data.assayId')

  const query = knex('Result')
    .where('endedOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
    .andWhere('deviceId', action.deviceId)
    .modify(
      (builder, moduleSerial, consumableLot, assayId) => {
        if (consumableLot || assayId) {
          /**
           * to avoid unhandled error
           * "Undefined binding(s) detected when compiling FIRST. Undefined column(s): [consumableLot, assayId]"
           * which happens when one of the bindings values is `undefined` - make sure params are
           * not `undefined`
           */
          if (!consumableLot) builder.where({ consumableLot })
          if (!assayId) builder.where({ assayId })
        } else if (moduleSerial) builder.where({ moduleSerial })
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

async function shouldSuppressTriggering(
  knex,
  action,
  { errorCodesToSuppress, suppressionDays }
) {
  const { deviceId } = action

  const moduleSerial = _.get(action, 'options.data.moduleSerial')
  if (!_.isNil(errorCodesToSuppress) && moduleSerial) {
    const { totalIssues } = await knex('Issue')
      .where({ deviceId })
      .whereRaw(`data->>"$.moduleSerial"=?`, moduleSerial)
      .whereRaw(
        `data->>"$.resultErrorCode" in(${errorCodesToSuppress.join(',')})`
      )
      .modify((builder, days) => {
        if (days) {
          builder.where(
            'i.createdOn',
            '>=',
            startOfDayUtc(subDays(new Date(), days))
          )
        }
      }, suppressionDays)
      .count('id as totalIssues')
      .first()
    return totalIssues > 0
  }
  return false
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
    .where('r.endedOn', '>=', startOfDayUtc(subDays(new Date(), 30)))
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
            `sum(case when errorcode in (${errorCodes.join(
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
  const { resultErrorCode } = action.options.data

  // Some error codes produce two log entries. One with log level "Info", the other with "Warn".
  // the rest is of the entry is identical. Ignore those duplicates.
  const errorCodesWithDuplicateLogEntries = ['2126']

  if (_.includes(errorCodes, parseInt(resultErrorCode, 10))) {
    const [{ totalErrors }] = await hardwareErrors(
      knex,
      action.deviceId,
      daysPeriod,
      errorCodes,
      errorCodesWithDuplicateLogEntries
    )
    action.options.data.totalErrors = totalErrors
    action.options.data.errorCodes = errorCodes
    return totalErrors >= minErrors
  }
  return false
}

async function hardwareErrors(
  knex,
  deviceId,
  daysPeriod,
  errorCodes,
  errorCodesWithDuplicateLogEntries
) {
  return knex('DeviceOperation')
    .where('startedOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
    .where('deviceId', deviceId)
    .select(
      knex.raw(
        `
      SUM(
        CASE WHEN
          IFNULL(data ->> '$.type', '') = 'gx-log'
          AND
          (data ->> '$.details.Errors[0].ErrorCode' not in (${errorCodesWithDuplicateLogEntries.join(
            ','
          )}) OR IFNULL(data ->> '$.logLevel', '') = 'INFO')
          AND
          CAST(IFNULL(data ->> '$.details.Errors[0].ErrorCode', 0) AS UNSIGNED ) in (${errorCodes.join(
            ','
          )})
        THEN 1
        ELSE 0
        END
      ) AS totalErrors
      `
      )
    )
}
module.exports = {
  analyzeErrors,
  analyzeResultsWithErrors,
  analyzeCategories,
  analyzeUnusedModules,
  hasUnusedModules,
  analyzeDeviceHardwareError,
  shouldSuppressTriggering,
}
