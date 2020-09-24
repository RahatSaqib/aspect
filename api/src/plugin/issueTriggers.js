const { compareAsc, parseISO } = require('date-fns')
const { issueTypeToId } = require('../shared/dictionary')

async function probesTooLow(knex, action) {
  const data = JSON.parse(action.issue.data)
  const moduleReplacedIssue = await knex('Issue')
    .where(knex.raw('data->>"$.replacedModuleSerial"=?', [data.moduleSerial]))
    .andWhere({
      deviceId: action.issue.deviceId,
      issueTypeId: await issueTypeToId('ModuleReplaced'),
    })
    .first()

  return (
    moduleReplacedIssue &&
    compareAsc(moduleReplacedIssue.createdOn, parseISO(data.disabledOn)) >= 0
  )
}
module.exports = {
  probesTooLow,
}
