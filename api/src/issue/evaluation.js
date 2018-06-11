const Promise = require('bluebird')
const _ = require('lodash')
const {
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  addWeeks,
  addMonths,
  addYears,
} = require('date-fns')
const {
  processUsingHandlebarsSyntax,
  getMustacheTokensInString,
} = require('../stringTemplate/service')
const { readTextFile } = require('../shared/io')

async function conditionsMet(knex, issue, conditions) {
  if (_.isEmpty(conditions)) {
    return Promise.resolve(true)
  }
  if (Array.isArray(conditions)) {
    return evaluateArrayOfConditions(knex, issue, conditions)
  }
  const { evaluationMethod = null, evaluationParameter = null } = conditions
  const evaluationMethods = {
    'inline-sql': evaluateInlineSql,
    'sql-script': evaluateSqlScript,
    'issue-age': triggeredEventOlderThan,
    'child-condition': conditionsMet,
    'child-conditions': conditionsMet,
  }
  if (!evaluationMethods[evaluationMethod]) {
    throw new Error(
      `Unrecognised evaluation method in condition ${evaluationMethod}`
    )
  }
  return evaluationMethods[evaluationMethod](knex, issue, evaluationParameter)
}

async function evaluateArrayOfConditions(knex, issue, conditions) {
  const andConditions = _.filter(
    conditions,
    condition => !condition.operator || condition.operator === 'AND'
  )
  const andConditionsMet = await Promise.spread(
    andConditions,
    async condition => conditionsMet(knex, issue, condition)
  )
  if (_.some(andConditionsMet, andConditionMet => !andConditionMet)) {
    return false
  }
  const orConditions = _.filter(conditions, { operator: 'OR' })
  const orConditionsMet = await Promise.spread(orConditions, async condition =>
    conditionsMet(knex, issue, condition)
  )
  if (_.every(orConditionsMet, orConditionMet => !orConditionMet)) {
    return false
  }
  return true
}

async function evaluateInlineSql(knex, issue, inlineSql) {
  return evaluateSql(knex, issue, inlineSql)
}

async function evaluateSqlScript(knex, issue, pathToSqlScript) {
  const sql = await readTextFile(pathToSqlScript)
  return evaluateSql(knex, issue, sql)
}

async function evaluateSql(knex, issue, sql) {
  const issueValues = _.omit(issue, 'conditions')
  const parameterPlaceholders = _.mapValues(issueValues, () => '?')
  /*
  issueValues Schema:
  -------------------
   id int NOT NULL
   issueTypeId int NOT NULL
   issueStatusId int NOT NULL
   partnerId int NOT NULL
   geographyId int NULL
   siteId int NULL
   deviceId int NULL
   resultId int NULL
   level int NOT NULL
   createdOn datetime NOT NULL
   updatedOn datetime NOT NULL
   triggeredOn datetime NOT NULL

   FOR ESCALATION CONDITIONS ONLY:
   escalateToLevel int NOT NULL
  */
  const parameterisedSqlQuery = processUsingHandlebarsSyntax(
    sql,
    parameterPlaceholders
  )
  const parameterPlaceHolders = getMustacheTokensInString(sql)
  const parameters = _.map(parameterPlaceHolders, parameterPlaceHolder =>
    processUsingHandlebarsSyntax(parameterPlaceHolder, issueValues)
  )
  const evaluatedResult = await knex.raw(parameterisedSqlQuery, parameters)
  return isResultTruthy(evaluatedResult, parameterisedSqlQuery, parameters)
}

function isResultTruthy(result, parameterisedSqlQuery, parameters) {
  const noResultException = Error(
    `Inline SQL '${parameterisedSqlQuery}' with ${parameters.join()} produced no result`
  )
  const manyResultsException = Error(
    `Inline SQL '${parameterisedSqlQuery}' with ${parameters.join()} produced multiple results`
  )
  if (_.isUndefined(result)) {
    throw noResultException
  }
  // Parse the RowDataObjects from a raw knex query
  const rowAndFieldObjects = JSON.parse(JSON.stringify(result))
  if (_.isArray(rowAndFieldObjects)) {
    if (rowAndFieldObjects.length > 0) {
      const queryResults = rowAndFieldObjects[0]
      if (queryResults.length > 1) {
        throw manyResultsException
      } else if (_.isEmpty(queryResults)) {
        throw noResultException
      }
      return isResultTruthy(
        _.head(queryResults),
        parameterisedSqlQuery,
        parameters
      )
    }
    throw noResultException
  }
  if (_.isPlainObject(result)) {
    // Is the first value in the record from the SQL query
    // return something that is truthy?
    return isResultTruthy(
      _.head(_.values(result)),
      parameterisedSqlQuery,
      parameters
    )
  }
  return !!result
}

async function triggeredEventOlderThan(knex, issue, issueAge) {
  const issueAgeSpec = _.assign(
    {
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      weeks: 0,
      months: 0,
      years: 0,
    },
    issueAge
  )
  const issueTriggeredOnPlusAge = addYears(
    addMonths(
      addWeeks(
        addDays(
          addHours(
            addMinutes(
              addSeconds(issue.triggeredOn, issueAgeSpec.seconds),
              issueAgeSpec.minutes
            ),
            issueAgeSpec.hours
          ),
          issueAgeSpec.days
        ),
        issueAgeSpec.weeks
      ),
      issueAgeSpec.months
    ),
    issueAgeSpec.years
  )
  return Promise.resolve(issueTriggeredOnPlusAge < new Date())
}

module.exports = {
  conditionsMet,
}
