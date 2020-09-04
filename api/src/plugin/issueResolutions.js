const { compareAsc } = require('date-fns')
const { issueTypeToId, issueStatusToId } = require('../shared/dictionary')

async function resolveIssueModuleDisabled(knex, issue) {
  const data = JSON.parse(issue.data)
  const moduleReplacedIssue = await knex('Issue')
    .where(knex.raw('data->>"$.replacedModuleSerial"=?', [data.moduleSerial]))
    .andWhere({
      deviceId: issue.deviceId,
      issueTypeId: await issueTypeToId('ModuleReplaced'),
    })
    .first()

  if (
    moduleReplacedIssue &&
    compareAsc(moduleReplacedIssue.createdOn, data.disabledOn) >= 0
  ) {
    await knex('Issue')
      .update({
        issueStatusId: await issueStatusToId('Resolved'),
      })
      .where({ id: issue.id })
  }
  return Promise.resolve(true)
}
module.exports = {
  resolveIssueModuleDisabled,
}
