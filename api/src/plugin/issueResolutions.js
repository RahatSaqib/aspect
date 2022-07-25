const compareAsc = require('date-fns/compareAsc')
const parseISO = require('date-fns/parseISO')
const addDays = require('date-fns/addDays')
const { subDays } = require('date-fns')
const { issueTypeToId } = require('../shared/dictionary')
const { hasUnusedModules } = require('./issueTriggers')
const { MIN_PERCENTAGE_FIELDS_COMPLETION_RATE } = require('../fact/service')

async function resolveIssueModuleDisabled(knex, issue) {
  const data = JSON.parse(issue.data)
  const moduleReplacedIssue = await knex('Issue')
    .where(knex.raw('data->>"$.replacedModuleSerial"=?', [data.moduleSerial]))
    .andWhere({
      deviceId: issue.deviceId,
      issueTypeId: await issueTypeToId('ModuleReplaced'),
    })
    .first()

  return moduleReplacedIssue && compareAsc(moduleReplacedIssue.createdOn, parseISO(data.disabledOn)) >= 0
}

async function resolveIssueUnusedModules(knex, issue, conditions) {
  const { deviceId } = issue
  const { minResults, expectedUsedModules } = conditions

  const { numberOfResults, numberOfModules } = await knex('Result as r')
    .where('r.endedOn', '>', addDays(new Date(), -30))
    .andWhere('r.deviceId', deviceId)
    .select(knex.raw('COUNT(*) as numberOfResults'), knex.raw('COUNT(DISTINCT r.moduleName) as numberOfModules'))
    .first()

  return !hasUnusedModules(numberOfResults, numberOfModules, minResults, expectedUsedModules)
}

async function resolveIssueSiteWithLowFieldCompletionRate(knex, issue) {
  const { siteId } = issue
  const sites = await knex('FactCustomFieldCompletion as fcr')
    .join('Site as si', 'si.id', 'fcr.siteId')
    .where('fcr.date', '>=', subDays(new Date(), 30))
    .andWhere('fcr.siteId', siteId)
    .select(
      'fcr.siteId',
      knex.raw('SUM(completionRate*recordCount)/SUM(recordCount) as completionRatePerSite'),
      'si.partnerId as partnerId',
      'si.geographyId as geographyId'
    )
    .groupBy('fcr.siteId', 'partnerId', 'geographyId')
    .having(knex.raw('completionRatePerSite >= ?', [MIN_PERCENTAGE_FIELDS_COMPLETION_RATE]))
  return sites.length > 0
}

module.exports = {
  resolveIssueModuleDisabled,
  resolveIssueUnusedModules,
  resolveIssueSiteWithLowFieldCompletionRate,
}
