const Promise = require('bluebird')
const _ = require('lodash')
const { readTextFile } = require('../shared/io')

const evaluationMethods = {
  'inline-sql': evaluateInlineSql,
  'sql-script': evaluateSqlScript,
  'plugin-function': evaluatePluginFunction,
  'child-condition': actionConditionsMet,
  'child-conditions': actionConditionsMet,
}

async function actionConditionsMet(knex, action, partnerId, conditions) {
  if (_.isEmpty(conditions)) {
    return Promise.resolve(true)
  }
  if (Array.isArray(conditions)) {
    return evaluateArrayOfConditions(knex, action, partnerId, conditions)
  }
  const { evaluationMethod = null, evaluationParameter = null } = conditions
  if (!evaluationMethods[evaluationMethod]) {
    throw new Error(
      `Unrecognised evaluation method in condition ${evaluationMethod}`
    )
  }
  return evaluationMethods[evaluationMethod](
    knex,
    action,
    partnerId,
    evaluationParameter
  )
}

async function evaluateArrayOfConditions(knex, action, partnerId, conditions) {
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
        actionConditionsMet(knex, action, partnerId, condition)
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
        actionConditionsMet(knex, action, partnerId, condition)
      )
    )
    if (_.every(orConditionsMet, orConditionMet => !orConditionMet)) {
      return false
    }
  }
  return true
}

async function evaluatePluginFunction(knex, action, partnerId, functionName) {
  const partner = await knex('Partner')
    .where({ id: partnerId })
    .first('plugin')
  if (partner == null) {
    return false
  }
  const { loadPlugin } = require('../plugin/registration')
  const plugins = await loadPlugin([partner.plugin], 'issueTriggers')
  const func = plugins[functionName]
  return func != null && func(knex, action)
}

async function evaluateInlineSql(knex, action, partnerId, inlineSql) {
  return evaluateSql(knex, action, partnerId, inlineSql)
}

async function evaluateSqlScript(knex, action, partnerId, pathToSqlScript) {
  const sql = await readTextFile(pathToSqlScript)
  return evaluateSql(knex, action, partnerId, sql)
}

async function evaluateSql(knex, action, partnerId, sql) {
  const {
    processUsingHandlebarsSyntax,
    getMustacheTokensInString,
  } = require('../stringTemplate/service')

  const parameterPlaceholders = _.mapValues(action, () => '?')
  const parameterisedSqlQuery = processUsingHandlebarsSyntax(
    sql,
    parameterPlaceholders
  )
  const parameterPlaceHolders = getMustacheTokensInString(sql)
  const parameters = _.map(parameterPlaceHolders, parameterPlaceHolder =>
    processUsingHandlebarsSyntax(parameterPlaceHolder, action)
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

module.exports = {
  actionConditionsMet,
}
