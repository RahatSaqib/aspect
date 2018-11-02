const {
  consumeInventoryForResult,
  addResultWorkflowLogIfChanged,
} = require('../../../deviceApi/result')

async function postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context

  const { pickedUpOn } = JSON.parse(result.resultData)
  await addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    'Device API Update',
    now,
    pickedUpOn
  )
  // // TODO ASP-355 consume inventory using a message listener instead
  // // of within plugin/same transaction
  await consumeInventoryForResult(knex, payload, result)
  return {}
}

module.exports = postProcessMergeResult
