const {
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
} = require('./common')

/**
 * A result is queried with a given DeviceLog,
 * called prior to any processing of result.
 */
function* preProcessGetResult(/* context */) {
  // nothing to do by default
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
  yield* addResultWorkflowLogIfChanged(context, result, previousResult)
  yield* consumeInventoryForResult(context, result)
  return {}
}

module.exports = {
  preProcessGetResult,
  postProcessGetResult,
  preProcessMergeResult,
  transformMergeResultPayload,
  postProcessMergeResult,
}
