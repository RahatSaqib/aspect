const {
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
  updateResultWorkflowStatusOnGetResult,
} = require('./common')

/**
 * A result is queried with a given DeviceLog,
 * called prior to any processing of result.
 */
function* preProcessGetResult({ knex, deviceLogId, query, now }) {
  const offset = Number(query.offset)
  yield* updateResultWorkflowStatusOnGetResult(knex, deviceLogId, offset, now)
}

/**
 * A result is queried with a given DeviceLog,
 * called after all processing of result.
 *
 * Return result to return to client
 */
function* postProcessGetResult(context, result) {
  return result
}

/**
 * A new result is received, called prior to any processing of result.
 */
function* preProcessMergeResult(/* context */) {
  // nothing to do by default
}

/**
 * A new result is received, transform result payload to new payload
 * to process in format expected by Device API
 * Default context.payload
 */
function* transformMergeResultPayload(context) {
  return context.payload
}

/**
 * A new result has been created and stored to the datatase, perform
 * any post processing of the result.
 *
 * Return the response to send back to client
 */
function* postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context
  yield* addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    now
  )
  // TODO can we consume inventory using a message listener instead
  // of within plugin/same transaction?
  yield* consumeInventoryForResult(knex, payload, result)
  return {}
}

/**
 * RESULT_LOGGED action has been dispatched referencing
 * a result handled by this plugin
 */
function* onResultLogged(/* context, result */) {
  // do nothing by default
}

module.exports = {
  preProcessGetResult,
  postProcessGetResult,
  preProcessMergeResult,
  transformMergeResultPayload,
  postProcessMergeResult,
  onResultLogged,
}
