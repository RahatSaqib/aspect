const subDays = require('date-fns/subDays')
const _ = require('lodash')
const { startOfDayUtc } = require('../shared/date')
const { resultCategoryToId } = require('../shared/dictionary')

const analyzeResultsWithErrors = (resultsWithErrors, totalResults, threshold, below, minResults) => {
  const percentage = resultsWithErrors / Math.max(parseFloat(totalResults), 1)
  return resultsWithErrors >= minResults && (below ? percentage <= threshold : percentage >= threshold)
}
async function analyzeWithQuery(knex, action, threshold, below, daysPeriod, minResults, queryBuilder) {
  const moduleSerial = _.get(action, 'options.data.moduleSerial')
  const consumableLot = _.get(action, 'options.data.consumableLot')
  const assayId = _.get(action, 'options.data.assayId')
  const { deviceId } = action
  const query = knex('Result')
    .where('endedOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
    .andWhere({ deviceId })
    .modify(
      (builder, moduleSerial, consumableLot, assayId) => {
        if (consumableLot || assayId) {
          /**
           * to avoid unhandled error
           * "Undefined binding(s) detected when compiling FIRST. Undefined column(s): [consumableLot, assayId]"
           * which happens when one of the bindings values is `undefined` - make sure params are
           * not `undefined`
           */
          if (consumableLot) {
            builder.where({ consumableLot })
          }
          if (assayId) builder.where({ assayId })
        } else if (moduleSerial) builder.where({ moduleSerial })
      },
      moduleSerial,
      consumableLot,
      assayId
    )

  if (queryBuilder) {
    query.modify(queryBuilder)
  }
  const { resultsWithErrors = 0, totalResults = 0, qtyOnSameModule = 0 } = await query
  action.options.data.resultsWithErrors = resultsWithErrors
  action.options.totalResults = totalResults
  if (!_.isNil(consumableLot) && qtyOnSameModule >= minResults) {
    action.options.data.qtyOnSameModule = qtyOnSameModule
    action.options.data.moduleSerialWithSameLot = moduleSerial
  }

  return analyzeResultsWithErrors(resultsWithErrors, totalResults, threshold, below, minResults)
}

async function shouldSuppressTriggering(knex, action, { errorCodesToSuppress, suppressionDays, issueType }) {
  const { deviceId } = action
  const resultCategoryId = _.get(action, 'options.data.resultCategoryId')
  const moduleSerial = _.get(action, 'options.data.moduleSerial')
  if (!_.isNil(errorCodesToSuppress) && moduleSerial) {
    const { totalIssues } = await knex('Issue as i')
      .join('IssueType as it', 'i.issueTypeId', 'it.id')
      .where({ deviceId })
      .andWhere('it.externalId', issueType)
      .andWhere(builder => {
        builder.whereRaw(`data->>"$.resultErrorCode" in(${errorCodesToSuppress.join(',')})`)
        if (resultCategoryId) builder.orWhereRaw('data->>"$.resultCategoryId" = ?', [resultCategoryId])
      })
      .modify((builder, days) => {
        if (days) {
          builder.where('i.createdOn', '>=', startOfDayUtc(subDays(new Date(), days)))
        }
      }, suppressionDays)
      .count('i.id as totalIssues')
      .first()
    return totalIssues > 0
  }

  return false
}

async function analyzeCategories(
  knex,
  action,
  { categoryId, errorCodes, threshold, below, daysPeriod, minResults, checkIfWillBeLotIssue }
) {
  const categoryToCompare = await resultCategoryToId(categoryId)
  const { deviceId } = action
  const { resultCategoryId, resultErrorCode } = action.options.data
  const moduleSerial = _.get(action, 'options.data.moduleSerial')
  let existingIssue = false
  if (checkIfWillBeLotIssue) {
    existingIssue = await knex('Issue')
      .where({ deviceId })
      .whereRaw('data->>"$.resultCategoryId" = ?', [resultCategoryId])
      .whereRaw('data->>"$.moduleSerialWithSameLot" = ?', [moduleSerial])
      .where('createdOn', '>=', startOfDayUtc(subDays(new Date(), 30)))
      .orderBy('createdOn', 'desc')
      .first()
  }

  if (
    !existingIssue &&
    ((!_.isNil(resultCategoryId) && resultCategoryId === categoryId) ||
      (!_.isNil(resultErrorCode) && _.includes(errorCodes, parseInt(resultErrorCode, 10))))
  ) {
    action.options.data.errorCodes = errorCodes
    action.options.data.resultCategoryId = resultCategoryId

    return analyzeWithQuery(knex, action, threshold, below, daysPeriod, minResults, builder =>
      builder.first(
        knex.raw(
          `sum(case when resultCategory1=? ${
            errorCodes && errorCodes.length > 0 ? ` OR errorcode in(${errorCodes.join(',')})` : ``
          } then 1 else 0 end) as resultsWithErrors, count(id) as totalResults`,
          categoryToCompare
        ),
        knex.raw(`sum(case when moduleSerial='${moduleSerial}' then 1 else 0 end) as qtyOnSameModule`)
      )
    )
  }
  return false
}

function hasUnusedModules(numberOfResults, numberOfModules, minResults, expectedUsedModules) {
  if ((!numberOfResults && numberOfResults !== 0) || (!numberOfModules && numberOfModules !== 0))
    throw new Error("numberOfResults and numberOfModules can't be null or undefined")

  return numberOfResults >= minResults && numberOfModules < expectedUsedModules
}

async function analyzeUnusedModules(knex, action, { minResults, expectedUsedModules }) {
  const { deviceId } = action

  const { numberOfResults, numberOfModules } = await knex('Result as r')
    .where('r.endedOn', '>=', startOfDayUtc(subDays(new Date(), 30)))
    .andWhere('r.deviceId', deviceId)
    .select(knex.raw('COUNT(*) as numberOfResults'), knex.raw('COUNT(DISTINCT r.moduleName) as numberOfModules'))
    .first()

  return hasUnusedModules(numberOfResults, numberOfModules, minResults, expectedUsedModules)
}

async function analyzeErrors(knex, action, evaluationFilterParameters) {
  const { resultErrorCode } = action.options.data
  const {
    errorCodes,
    threshold,
    below,
    daysPeriod,
    minResults,
    checkIfWillBeLotIssue = false,
  } = evaluationFilterParameters
  const { deviceId } = action
  const moduleSerial = _.get(action, 'options.data.moduleSerial')
  let existingIssue = false
  if (checkIfWillBeLotIssue) {
    existingIssue = await knex('Issue')
      .where({ deviceId })
      .whereRaw(`data->>"$.resultErrorCode" in(${errorCodes.join(',')})`)
      .whereRaw('data->>"$.moduleSerialWithSameLot" = ?', [moduleSerial])
      .first()
  }

  if (!existingIssue && _.includes(errorCodes, parseInt(resultErrorCode, 10))) {
    action.options.data.errorCodes = errorCodes
    return analyzeWithQuery(knex, action, threshold, below, daysPeriod, minResults, builder =>
      builder.first(
        knex.raw(
          `sum(case when errorcode in (${errorCodes.join(
            ','
          )}) then 1 else 0 end) as resultsWithErrors, count(id) as totalResults`
        ),
        knex.raw(`sum(case when moduleSerial='${moduleSerial}' then 1 else 0 end) as qtyOnSameModule`)
      )
    )
  }
  return false
}

async function analyzeDeviceHardwareError(knex, action, { errorCodes, daysPeriod, minErrors }) {
  const { resultErrorCode } = action.options.data
  if (_.includes(errorCodes, parseInt(resultErrorCode, 10))) {
    const [{ totalErrors }] = await hardwareErrors(knex, action.deviceId, daysPeriod, errorCodes)
    action.options.data.totalErrors = totalErrors
    action.options.data.errorCodes = errorCodes
    return totalErrors >= minErrors
  }
  return false
}

async function checkHardwareSuppression(knex, action, { errorCodesToSuppress }) {
  const { deviceId } = action
  const moduleSerial = _.get(action, 'options.data.moduleSerial')
  if (!_.isNil(errorCodesToSuppress) && moduleSerial) {
    const { totalIssues } = await knex('Issue')
      .where({ deviceId })
      .whereRaw(`data->>"$.details.Errors[0].SiteSerialNumber"=?`, moduleSerial)
      .whereRaw(`data->>'$.details.Errors[0].ErrorCode' in (${errorCodesToSuppress.join(',')})`)
      .count('id as totalIssues')
      .first()
    return totalIssues > 0
  }
  return false
}

async function hardwareErrors(knex, deviceId, daysPeriod, errorCodes) {
  // Some error codes produce two log entries. One with log level "Info", the other with "Warn".
  // the rest is of the entry is identical. Ignore those duplicates.
  const errorCodesWithDuplicateLogEntries = [2126]

  // Some error codes produce several log entries in a short time frame
  // For those error codes, only count entries that are at least an hour apart
  const errorCodesToDeduplicateIfWithinTimeFrame = [1001, 1002, 2014, 4008, 4012, 4017]

  // note that currently all hardware based issues only contain one error code as
  // the trigger condition. If we have to support multiple errorcodes, some of
  // which are in the `errorCodesToDeduplicateIfWithinTimeFrame` array and others aren't,
  // we may have to rethink this (though I'm not sure that's even possible to solve)
  if (errorCodes.some(e => errorCodesToDeduplicateIfWithinTimeFrame.includes(e))) {
    // In this subquery, we're using the 'lag' function in MySQL to select the date of the previous row's log entry
    // We can then use that subquery to only select entries that are at least 60 minutes apart from the previous one
    const subquery = knex('DeviceOperation as do')
      .join('Device as d', 'do.deviceApiKeyId', 'd.deviceApiKeyId')
      .where('d.id', deviceId)
      .where('occurredOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
      .whereRaw(`IFNULL(data ->> '$.type', '') = 'gx-log'`)
      .whereRaw(`data->>'$.details.Errors[0].ErrorCode' in (${errorCodes.join(',')})`)
      .select(
        'do.id',
        'occurredOn',
        knex.raw('lag(occurredOn, 1) over (partition by deviceId order by occurredOn) as previousOccurredOn')
      )
      .as('logEntriesWithTimeSpan')

    return knex
      .count('id as totalErrors')
      .from(subquery)
      .whereRaw('timestampdiff(minute, previousOccurredOn, occurredOn) > 60')
      .orWhere('previousOccurredOn', null)
  }

  return knex('DeviceOperation')
    .where('deviceId', deviceId)
    .where('occurredOn', '>=', startOfDayUtc(subDays(new Date(), daysPeriod)))
    .whereRaw(`IFNULL(data ->> '$.type', '') = 'gx-log'`)
    .whereRaw(`data ->> '$.details.Errors[0].ErrorCode' in (${errorCodes.join(',')})`)
    .where(qb => {
      qb.whereRaw(
        `data ->> '$.details.Errors[0].ErrorCode' not in (${errorCodesWithDuplicateLogEntries.join(',')})`
      ).orWhereRaw(`IFNULL(data ->> '$.logLevel', '') = 'INFO'`)
    })
    .count('id as totalErrors')
}
module.exports = {
  analyzeErrors,
  analyzeResultsWithErrors,
  analyzeCategories,
  analyzeUnusedModules,
  hasUnusedModules,
  analyzeDeviceHardwareError,
  shouldSuppressTriggering,
  checkHardwareSuppression,
}
