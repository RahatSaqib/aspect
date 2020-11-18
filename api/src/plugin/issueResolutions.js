const compareAsc = require('date-fns/compareAsc')
const parseISO = require('date-fns/parseISO')
const addDays = require('date-fns/addDays')
const { issueTypeToId } = require('../shared/dictionary')

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

function wereAllModulesUsed({ numberOfResults, numberOfModules }) {
  return numberOfResults >= 20 && numberOfModules >= 4
}

async function resolveIssueUnusedModules(knex, issue) {
  const { deviceId } = issue
  const { numberOfResults, numberOfModules } = await knex('Result as r')
    .where('r.endedOn', '>', addDays(new Date(), -30))
    .andWhere('r.deviceId', deviceId)
    .select(
      knex.raw('COUNT(*) as numberOfResults'),
      knex.raw('COUNT(DISTINCT r.moduleName) as numberOfModules')
    )
    .first()

  return wereAllModulesUsed({ numberOfResults, numberOfModules })
}

module.exports = {
  resolveIssueModuleDisabled,
  resolveIssueUnusedModules,
}
