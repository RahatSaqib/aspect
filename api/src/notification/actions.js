// ----------- Action Types ---------------------
const types = {
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  NOTIFICATION_MESSAGE_PROCESSED: 'NOTIFICATION_MESSAGE_PROCESSED',
  ISSUE_NOTIFICATION_TRIGGERED: 'ISSUE_NOTIFICATION_TRIGGERED',
  RESULT_ANALYZE_TIMEOUT: 'RESULT_ANALYZE_TIMEOUT',
  DEVICE_INACTIVE_NOTIFICATION_ANALYSIS: 'DEVICE_INACTIVE_NOTIFICATION_ANALYSIS',
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

function notificationMessageProcessed({ smsMessageId, emailMessageId, webhookMessageId }) {
  return {
    type: types.NOTIFICATION_MESSAGE_PROCESSED,
    data: { smsMessageId, emailMessageId, webhookMessageId },
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

function deviceInactiveNotificationAnalysis() {
  return {
    type: types.DEVICE_INACTIVE_NOTIFICATION_ANALYSIS,
  }
}

module.exports = {
  types,
  notificationCreated,
  issueNotificationTriggered,
  resultAnalyzeTimeout,
  notificationMessageProcessed,
  deviceInactiveNotificationAnalysis,
}
