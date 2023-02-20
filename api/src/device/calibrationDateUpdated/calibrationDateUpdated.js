const { getActiveCalibrationIssue } = require('./db')
const { resolveIssues } = require('../../issue/actions')

async function onCalibrationDateUpdated(action, { messageContext }) {
  const { deviceId } = action
  const context = messageContext.bindActionCreators({
    resolveIssues,
  })

  return context.run(async knex => {
    const { issueId } = await getActiveCalibrationIssue(knex, deviceId)
    if (issueId) {
      context.resolveIssues(issueId)
    }
  })
}

module.exports = onCalibrationDateUpdated
