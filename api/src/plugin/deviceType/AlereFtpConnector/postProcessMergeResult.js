const { consumeInventoryFromPayload } = require('../../../deviceApi/result')

async function postProcessMergeResult(context, result) {
  const { knex, payload, messageContext, userId } = context

  // // TODO ASP-355 consume inventory using a message listener instead
  // // of within plugin/same transaction
  await consumeInventoryFromPayload(knex, payload, result, messageContext, userId)
  return {}
}

module.exports = postProcessMergeResult
