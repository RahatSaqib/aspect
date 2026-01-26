const _ = require('lodash')
const {
  types: { RESULT_UPDATED },
} = require('../../result/actions')

/**
 * Creates a new context object with a different payload, maintaining parent reference
 * for delegation of updates and notifications.
 *
 * @param {Object} context - The parent context object
 * @param {Object} payload - The new payload to use in the child context
 * @returns {Object} New context object with updated payload and parent reference
 */
function withPayload(context, payload) {
  return { ...context, payload, parent: context }
}

/**
 * Adds an update to the device log. If called from a child context,
 * delegates to the parent context to ensure updates bubble up to the root.
 *
 * @param {Object} context - The context object (may be child or root)
 * @param {string} prop - The property name to update in DeviceLog
 * @param {*} value - The value to set
 */
function addDeviceLogUpdate(context, prop, value) {
  if (context.parent) {
    return addDeviceLogUpdate(context.parent, prop, value)
  }

  let update = context.deviceLogUpdate
  if (!update) {
    update = {}
    context.deviceLogUpdate = update
  }

  // add result updated on first device log update
  if (prop === 'resultId' && update[prop] == null) {
    notifyResultUpdated(context, value, context.deviceLogId)
  }
  update[prop] = value
}

/**
 * Notifies that a result has been updated. If called from a child context,
 * delegates to the parent context to ensure notifications are not duplicated.
 *
 * @param {Object} context - The context object (may be child or root)
 * @param {number} resultId - The ID of the result that was updated
 * @param {number} deviceLogId - The ID of the device log entry
 */
function notifyResultUpdated(context, resultId, deviceLogId) {
  if (context.parent) {
    return notifyResultUpdated(context.parent, resultId, deviceLogId)
  }

  if (
    _.findIndex(context.messageContext.actions, {
      type: RESULT_UPDATED,
      resultId,
    }) === -1
  ) {
    // only dispatch result updated action once per result id
    // within this Device API transaction
    context.messageContext.resultUpdated(resultId, deviceLogId)
  }
}

module.exports = {
  withPayload,
  addDeviceLogUpdate,
  notifyResultUpdated,
}
