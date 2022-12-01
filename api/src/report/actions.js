// ----------- Action Types ---------------------
const types = {
  REPORT_BASED_NOTIFICATION_REQUESTED: 'REPORT_BASED_NOTIFICATION_REQUESTED',
}

// ----------- Action Creators -------------------

function reportBasedNotificationRequested(notificationTypeId) {
  return {
    type: types.REPORT_BASED_NOTIFICATION_REQUESTED,
    notificationTypeId,
  }
}

module.exports = {
  types,
  reportBasedNotificationRequested,
}
