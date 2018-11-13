// ----------- Action Types ---------------------
const types = {
  LOG_CREATED: 'LOG_CREATED',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the log has been
 * created.
 *
 * logKey: What is being logged? e.g. 'request'
 * severity: e.g. 'info', 'warn', 'error'
 * data: log specific data as JSON
 * userName: Authenticated user / device, or null if unknown
 */
function logCreated(logKey, severity, data, userName = null) {
  if (!logKey) {
    throw new Error('Must specify logKey')
  }
  return {
    type: types.LOG_CREATED,
    logKey,
    severity,
    data,
    userName,
    createdOn: new Date().toISOString(),
  }
}

module.exports = {
  types,
  logCreated,
}
