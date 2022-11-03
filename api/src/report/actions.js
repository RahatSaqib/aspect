// ----------- Action Types ---------------------
const types = {
  REPORT_READY_TO_DELIVER: 'REPORT_READY_TO_DELIVER',
}

// ----------- Action Creators -------------------

function reportReadyToDelivery(notificationTypeId) {
  return {
    type: types.REPORT_READY_TO_DELIVER,
    notificationTypeId,
  }
}

module.exports = {
  types,
  reportReadyToDelivery,
}
