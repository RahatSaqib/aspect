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
const { issueEscalated } = require('./actions')
const {
  processUsingHandlebarsSyntax,
  getMustacheTokensInString,
} = require('../stringTemplate/service')
const { readTextFile } = require('../shared/io')

function onEscalateIssues() {
  return async (action, { messageContext: context }) => {
    context.bindActionCreators({ issueEscalated })
    context.transact(async knex => {
      const openIssuesToCheck = await findOpenIssuesToCheckForEscalation(
        knex,
        action.issueId
      )
      if (_.isEmpty(openIssuesToCheck)) {
        return Promise.resolve()
      }
      return Promise.each(openIssuesToCheck, async issueEscalationTrigger => {
        const shouldEscalate = await escalationConditionsMet(
          issueEscalationTrigger
        )
        if (shouldEscalate) {
          await knex('Issue')
            .where('id', issueEscalationTrigger.id)
            .update({ level: issueEscalationTrigger.escalateToLevel })
          context.dispatch(
            issueEscalated(
              issueEscalationTrigger.id,
              issueEscalationTrigger.escalateToLevel
            )
          )
        }
      })
    })
  }
}

async function findOpenIssuesToCheckForEscalation(knex, issueId) {
  const resolvedIssueEventStatus = await knex('IssueEventStatus')
    .where('externalId', 'Resolved')
    .first()
  const triggeredIssueEventStatus = await knex('IssueEventStatus')
    .where('externalId', 'Triggered')
    .first()
  return knex('Issue as i')
    .leftJoin('IssueEvent resolvedIssueEvent', function() {
      this.on('i.id', 'resolvedIssueEvent.issueId').on(
        'resolvedIssueEvent.issueEventStatusId',
        knex.raw(resolvedIssueEventStatus.id)
      )
    })
    .join('IssueEvent triggeredIssueEvent', function() {
      this.on('i.id', 'triggeredIssueEvent.issueId').on(
        'triggeredIssueEvent.issueEventStatusId',
        knex.raw(triggeredIssueEventStatus.id)
      )
    })
    .join('IssueEscalationTrigger as iet', function() {
      this.on('i.issueTypeId', 'iet.id')
        .on('i.partnerId', 'iet.partnerId')
        .on('i.level', '<', 'iet.escalateToLevel')
    })
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .where(function() {
      this.whereNotIn('is.externalId', ['Inactive', 'Resolved'])
      if (issueId) {
        this.andWhere('i.id', issueId)
      }
    })
    .andWhere(function() {
      this.whereNull('resolvedIssueEvent.id')
    })
    .groupBy('i.id', 'iet.id')
    .orderBy(['i.createdOn', 'iet.escalateToLevel'], 'asc')
    .select(
      'i.*',
      'iet.escalateToLevel',
      'iet.escalationConditions',
      knex.raw('max(triggeredIssueEvent.createdOn) as triggeredOn')
    )
    .map(issueEscalationTrigger =>
      Object.assign({}, issueEscalationTrigger, {
        escalationConditions: JSON.parse(
          issueEscalationTrigger.escalationConditions
        ),
      })
    )
}

async function escalationConditionsMet(knex, issue, escalationConditions) {
  if (_.isEmpty(escalationConditions)) {
    return Promise.resolve(true)
  }
  if (Array.isArray(escalationConditions)) {
    return evaluateArrayOfEscalationConditions(
      knex,
      issue,
      escalationConditions
    )
  }
  const {
    evaluationMethod = null,
    evaluationParameter = null,
  } = escalationConditions
  const evaluationMethods = {
    'inline-sql': evaluateInlineSql,
    'sql-script': evaluateSqlScript,
    'issue-age': triggerEventOlderThan,
    'child-condition': escalationConditionsMet,
    'child-conditions': escalationConditionsMet,
  }
  if (!evaluationMethods[evaluationMethod]) {
    throw new Error(
      `Unrecognised evaluation method in escalation condition ${evaluationMethod}`
    )
  }
  return evaluationMethods[evaluationMethod](knex, issue, evaluationParameter)
}

async function evaluateArrayOfEscalationConditions(
  knex,
  issue,
  escalationConditions
) {
  const andConditions = _.filter(
    escalationConditions,
    escalationCondition =>
      !escalationCondition.operator || escalationCondition.operator === 'AND'
  )
  const andConditionsMet = await Promise.spread(
    andConditions,
    async condition => escalationConditionsMet(knex, issue, condition)
  )
  if (_.some(andConditionsMet, andConditionMet => !andConditionMet)) {
    return false
  }
  const orConditions = _.filter(escalationConditions, { operator: 'OR' })
  const orConditionsMet = await Promise.spread(orConditions, async condition =>
    escalationConditionsMet(knex, issue, condition)
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
  const issueValues = _.omit(issue, 'escalationConditions')
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
   escalateToLevel int NOT NULL
   triggeredOn datetime NOT NULL
  */
  const parameterisedSqlQuery = processUsingHandlebarsSyntax(
    sql,
    parameterPlaceholders
  )
  const parameters = processUsingHandlebarsSyntax(
    getMustacheTokensInString(sql).join(),
    issueValues
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
  if (_.isArray(result)) {
    if (result.length > 1) {
      throw manyResultsException
    } else if (_.isEmpty(result)) {
      throw noResultException
    }
    return isResultTruthy(_.head(result), parameterisedSqlQuery, parameters)
  }
  if (_.isPlainObject(result)) {
    // Is the first value in the record from the SQL query
    // return something that is truthy?
    return isResultTruthy(_.head(_.values(result)))
  }
  // Is the result value from the SQL query truthy?
  return !!result
}

async function triggerEventOlderThan(knex, issue, issueAge) {
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
              addSeconds(issueAge.triggeredOn, issueAgeSpec.seconds),
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
  onEscalateIssues,
}
