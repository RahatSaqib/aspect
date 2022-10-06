// ----------- Action Types ---------------------
const types = {
  REPORT_READY_TO_DELIVER: 'REPORT_READY_TO_DELIVER',
}

// ----------- Action Creators -------------------

/**
 * Is called when inventory if going out-of-stock in [daysDue]
 */
function reportReadyToDelivery(reportId, notificationFilter) {
  if (!reportId || !notificationFilter) {
    throw new Error('Must specify reportID, notificationFilter')
  }

  return {
    type: types.REPORT_READY_TO_DELIVER,
    reportId,
    notificationFilter,
  }
}

module.exports = {
  types,
  reportReadyToDelivery,
}
