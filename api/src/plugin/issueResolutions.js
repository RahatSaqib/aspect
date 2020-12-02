const compareAsc = require('date-fns/compareAsc')
const parseISO = require('date-fns/parseISO')
const addDays = require('date-fns/addDays')
const { issueTypeToId } = require('../shared/dictionary')
const { hasUnusedModules } = require('./issueTriggers')

async function resolveIssueModuleDisabled(knex, issue) {
  const data = JSON.parse(issue.data)
  const moduleReplacedIssue = await knex('Issue')
    .where(knex.raw('data->>"$.replacedModuleSerial"=?', [data.moduleSerial]))
    .andWhere({
      deviceId: issue.deviceId,
      issueTypeId: await issueTypeToId('ModuleReplaced'),
    })
    .first()

  return (
    moduleReplacedIssue &&
    compareAsc(moduleReplacedIssue.createdOn, parseISO(data.disabledOn)) >= 0
  )
}

async function resolveIssueUnusedModules(knex, issue, conditions) {
  const { deviceId } = issue
  const { minResults, expectedUsedModules } = conditions

  const { numberOfResults, numberOfModules } = await knex('Result as r')
    .where('r.endedOn', '>', addDays(new Date(), -30))
    .andWhere('r.deviceId', deviceId)
    .select(
      knex.raw('COUNT(*) as numberOfResults'),
      knex.raw('COUNT(DISTINCT r.moduleName) as numberOfModules')
    )
    .first()

  return !hasUnusedModules(
    numberOfResults,
    numberOfModules,
    minResults,
    expectedUsedModules
  )
}

async function resolveDeviceOperationIssue(knex, issue, conditions) {
  const { deviceId } = issue
  const {
    errorCode,
    mergeGroup,
    resolutionCondition: { minResults = 1, withinDays = 5 } = {
      minResults: 1,
      withinDays: 5,
    },
  } = conditions

  // TODO: update logic for using props from 'resolutionCondition'

  // for now treat issue resolved if we have 1 result within last 5 days
  const { numberOfResults } = await knex('Result as r')
    .where('r.endedOn', '>', addDays(new Date(), -withinDays))
    .andWhere('r.deviceId', deviceId)
    .select(knex.raw('COUNT(*) as numberOfResults'))
    .first()

  return numberOfResults >= minResults
}

module.exports = {
  resolveIssueModuleDisabled,
  resolveIssueUnusedModules,
  resolveDeviceOperationIssue,
}
