const {
  addResultWorkflowLogIfChanged,
  consumeInventoryForResult,
} = require('./common')

async function postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context
  await addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    'Device API Update',
    now
  )
  // // TODO ASP-355 consume inventory using a message listener instead
  // // of within plugin/same transaction
  await consumeInventoryForResult(knex, payload, result)
  return {}
}

module.exports = postProcessMergeResult
