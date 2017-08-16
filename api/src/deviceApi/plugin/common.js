const { isEmpty } = require('lodash')
const inventory = require('../../inventory/service')

/**
 * Consumes inventory for the new result
 */
function* consumeInventoryForResult(context, result) {
  const { knex, payload } = context
  // Update Inventory Levels at Site
  const consumablesInResultData = isEmpty(payload.consumable)
    ? []
    : payload.consumable
  yield* inventory.consumeInventoryForResult(
    result.id,
    result.assayId,
    result.siteId,
    consumablesInResultData,
    result.partnerId,
    result.startedOn,
    result.endedOn,
    knex
  )
}

module.exports = {
  consumeInventoryForResult,
}
