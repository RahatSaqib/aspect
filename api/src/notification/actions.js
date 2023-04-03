// ----------- Action Types ---------------------
const types = {
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  ISSUE_NOTIFICATION_TRIGGERED: 'ISSUE_NOTIFICATION_TRIGGERED',
  RESULT_ANALYZE_TIMEOUT: 'RESULT_ANALYZE_TIMEOUT',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the notification
 * has been created with the given id
 *
 * issuedId is required.
 */
function notificationCreated(notificationId) {
  if (!notificationId) {
    throw new Error('Must specify notificationId')
  }
  return {
    type: types.NOTIFICATION_CREATED,
    notificationId,
  }
}

function issueNotificationTriggered(issueId, issueTypeId) {
  return {
    type: types.ISSUE_NOTIFICATION_TRIGGERED,
    issueId,
    issueTypeId,
  }
}

function resultAnalyzeTimeout() {
  return {
    type: types.RESULT_ANALYZE_TIMEOUT,
  }
}

module.exports = {
  types,
  notificationCreated,
  issueNotificationTriggered,
  resultAnalyzeTimeout,
}
