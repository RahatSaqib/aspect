const { getActiveCalibrationIssue } = require('./db')
const { resolveIssues } = require('../../issue/actions')

async function onCalibrationDateUpdated(action, { messageContext }) {
  const { deviceId } = action
  const context = messageContext.bindActionCreators({
    resolveIssues,
  })

  return context.run(async knex => {
    const issue = await getActiveCalibrationIssue(knex, deviceId)
    if (issue) {
      const { issueId } = issue
      context.resolveIssues(issueId)
    }
  })
}

module.exports = onCalibrationDateUpdated
