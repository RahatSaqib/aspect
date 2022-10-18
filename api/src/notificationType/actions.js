// ----------- Action Types ---------------------
const types = {
  NOTIFICATION_TYPE_CREATED: 'NOTIFICATION_TYPE_CREATED',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify that new notificationTypeId
 * has been created with the given id
 *
 * notificationTypeId is required.
 */

function notificationTypeCreated(notificationTypeId) {
  if (!notificationTypeId) {
    throw new Error('Must specify notificationTypeId')
  }
  return {
    type: types.NOTIFICATION_TYPE_CREATED,
    notificationTypeId,
  }
}
module.exports = {
  types,
  notificationTypeCreated,
}
