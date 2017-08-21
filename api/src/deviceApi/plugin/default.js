const {
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
} = require('./common')

/**
 * A result is queried
 * called prior to any processing of result.
 */
function* preProcessGetResult(/* context */) {
  // nothing to do by default
}

/**
 * A result is queried
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
    'Device API Update',
    now
  )
  // TODO ASP-355 consume inventory using a message listener instead
  // of within plugin/same transaction
  yield* consumeInventoryForResult(knex, payload, result)
  return {}
}

/**
 * RESULT_LOGGED action has been dispatched referencing
 * a result handled by this plugin
 */
function* onResultLogged(/* context */) {
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
