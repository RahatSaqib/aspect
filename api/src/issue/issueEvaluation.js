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
const { readTextFile } = require('../shared/io')

const evaluationMethods = {
  'inline-sql': evaluateInlineSql,
  'sql-script': evaluateSqlScript,
  'plugin-function': evaluatePluginFunction,
  'issue-age': triggeredEventOlderThan,
  'result-category': checkResultCategory,
  'child-condition': issueConditionsMet,
  'child-conditions': issueConditionsMet,
}

async function issueConditionsMet(knex, issue, conditions) {
  if (_.isEmpty(conditions)) {
    return Promise.resolve(true)
  }
  if (Array.isArray(conditions)) {
    return evaluateArrayOfConditions(knex, issue, conditions)
  }
  const { evaluationMethod = null, evaluationParameter = null } = conditions
  if (!evaluationMethods[evaluationMethod]) {
    throw new Error(
      `Unrecognised evaluation method in condition ${evaluationMethod}`
    )
  }
  return evaluationMethods[evaluationMethod](knex, issue, evaluationParameter)
}

async function evaluateArrayOfConditions(knex, issue, conditions) {
  const invalidConditions = _.filter(
    conditions,
    ({ evaluationMethod = null }) => !evaluationMethods[evaluationMethod]
  )
  if (!_.isEmpty(invalidConditions)) {
    const invalidMethods = _.orderBy(
      _.uniq(
        _.filter(
          _.map(invalidConditions, 'evaluationMethod'),
          evaluationMethod => !!evaluationMethod
        )
      )
    ).join()
    throw new Error(
      `Unrecognised evaluation method(s) in condition ${invalidMethods}`.trim()
    )
  }
  const andConditions = _.filter(
    conditions,
    condition => !condition.operator || condition.operator === 'AND'
  )
  if (!_.isEmpty(andConditions)) {
    const andConditionsMet = await Promise.all(
      _.map(andConditions, async condition =>
        issueConditionsMet(knex, issue, condition)
      )
    )
    if (_.some(andConditionsMet, andConditionMet => !andConditionMet)) {
      return false
    }
  }
  const orConditions = _.filter(conditions, { operator: 'OR' })
  if (!_.isEmpty(orConditions)) {
    const orConditionsMet = await Promise.all(
      _.map(orConditions, async condition =>
        issueConditionsMet(knex, issue, condition)
      )
    )
    if (_.every(orConditionsMet, orConditionMet => !orConditionMet)) {
      return false
    }
  }
  return true
}

async function evaluatePluginFunction(knex, issue, functionName) {
  const partner = await knex('Partner')
    .where({ id: issue.partnerId })
    .first('plugin')
  if (partner == null) {
    return false
  }
  const { loadPlugin } = require('../plugin/registration')
  const resolutions = await loadPlugin([partner.plugin], 'issueResolutions')
  const escalations = await loadPlugin([partner.plugin], 'issueEscalations')
  const plugins = { ...resolutions, ...escalations }
  const func = plugins[functionName]
  return func != null && func(knex, issue)
}

async function evaluateInlineSql(knex, issue, inlineSql) {
  return evaluateSql(knex, issue, inlineSql)
}

async function evaluateSqlScript(knex, issue, pathToSqlScript) {
  const sql = await readTextFile(pathToSqlScript)
  return evaluateSql(knex, issue, sql)
}

async function evaluateSql(knex, issue, sql) {
  const {
    processUsingHandlebarsSyntax,
    getMustacheTokensInString,
  } = require('../stringTemplate/service')

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
    `Inline SQL '${parameterisedSqlQuery}'${
      _.isEmpty(parameters) ? '' : ` with ${parameters.join()}`
    } produced no result`
  )
  if (_.isUndefined(result)) {
    throw noResultException
  }
  // Parse the RowDataObjects from a raw knex query
  const rowAndFieldObjects = JSON.parse(JSON.stringify(result))
  if (_.isArray(rowAndFieldObjects)) {
    if (rowAndFieldObjects.length > 0) {
      const queryResult = _.head(rowAndFieldObjects)
      return isResultTruthy(queryResult, parameterisedSqlQuery, parameters)
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

async function checkResultCategory(knex, issue, category) {
  if (category.index !== 1 && category.index !== 2) {
    // currently only support two categories in data model
    return false
  }
  const result = await knex('Result as r')
    .join('ResultCategory as rc', 'rc.id', `r.resultCategory${category.index}`)
    .join('Issue as i', 'i.resultId', 'r.id')
    .where({ 'i.id': issue.id, 'rc.externalId': category.externalId })
    .first('r.id')
  return result != null
}

module.exports = {
  issueConditionsMet,
}
