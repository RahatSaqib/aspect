const { addResultWorkflowLogIfChanged, consumeInventoryForResult } = require('./common')

/**
 * A new result is received, transform result payload to new payload
 * to process in format expected by Device API
 * Default context.payload
 */
function* transformResultPayload(context) {
  return context.payload
}

/**
 * A new result has been created and stored to the datatase, perform
 * any post processing of the result.
 * Default process consumable in inventory
 */
function* postProcessResult(context, result, previousResult) {
  yield* addResultWorkflowLogIfChanged(context, result, previousResult)
  yield* consumeInventoryForResult(context, result)
}

module.exports = {
  transformResultPayload,
  postProcessResult,
}
