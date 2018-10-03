const {
  onAlertMessageCreated,
  onAlertMessageUpdateAfterIssueDataChanged,
} = require('./service')

const subscriptions = [
  {
    actions: {
      ALERT_MESSAGE_CREATED: onAlertMessageCreated,
      ALERT_ISSUE_DATA_CHANGED: onAlertMessageUpdateAfterIssueDataChanged,
    },
  },
]

module.exports = { subscriptions }
