const { issueTypeToId, issueStatusToId } = require('../shared/dictionary')

async function resolveIssueModuleDisabled(knex, issue) {
  const data = JSON.parse(issue.data)
  const moduleReplacedIssue = await knex('Issue')
    .andWhere(
      knex.raw('data->>"$.replacedModuleSerial"=?', [data.moduleSerial])
    )
    .andWhere({
      deviceId: issue.deviceId,
      issueTypeId: await issueTypeToId('ModuleReplaced'),
    })
    .first()
  if (moduleReplacedIssue) {
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
