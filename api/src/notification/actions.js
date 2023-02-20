// ----------- Action Types ---------------------
const types = {
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  ISSUE_NOTIFICATION_TRIGGERED: 'ISSUE_NOTIFICATION_TRIGGERED',
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

module.exports = {
  types,
  notificationCreated,
  issueNotificationTriggered,
}
