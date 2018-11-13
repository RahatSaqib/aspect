// ----------- Action Types ---------------------
const types = {
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
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

module.exports = {
  types,
  notificationCreated,
}
