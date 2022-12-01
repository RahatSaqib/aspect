const { data: issueEventTriggerBase } = require('../../fixtures/IssueEventTrigger.json')

module.exports = [
  ...issueEventTriggerBase,
  {
    issueType: 'ResultUpdated',
    issueEventStatus: 'Triggered',
    triggerConditions: {
      action: 'RESULT_LOGGED',
      conditions: {
        evaluationMethod: 'plugin-function',
        evaluationParameter: 'shouldSendResultToItis',
      },
    },
  },
]
