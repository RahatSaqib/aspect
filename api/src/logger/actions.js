// ----------- Action Types ---------------------
const types = {
  LOG_CREATED: 'LOG_CREATED',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the log has been
 * created.
 *
 * logKey: What is being logged? e.g. "request"
 * severity: e.g. "info", "warn", "error"
 * message: Log Message
 * userName: Authenticated user / device, or null if unknown
 * data: log specific data as JSON, or null if no additional context available
 */
function logCreated(logKey, severity, message, userName = null, data = {}) {
  if (logKey == null) {
    throw new Error('Must specify logKey')
  }
  return {
    type: types.LOG_CREATED,
    logKey,
    severity,
    message,
    userName,
    data,
    createdOn: new Date().toISOString(),
  }
}

module.exports = {
  types,
  logCreated,
}
