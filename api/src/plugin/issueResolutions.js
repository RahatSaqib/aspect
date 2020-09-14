const { compareAsc } = require('date-fns')
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
    compareAsc(moduleReplacedIssue.createdOn, data.disabledOn) >= 0
  )
}
module.exports = {
  resolveIssueModuleDisabled,
}
