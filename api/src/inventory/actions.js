const _ = require('lodash')

// ----------- Action Types ---------------------
const types = {
  INVENTORY_REAGENT_HEALTH: 'INVENTORY_REAGENT_HEALTH',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify the inventory
 * has a reagent health issue
 *
 * deviceId, consumableId is required.
 */
function inventoryReagentHealth(deviceId, consumableId) {
  if (_.isNil(deviceId) || _.isNil(consumableId)) {
    throw new Error('Must specify deviceId, consumableId')
  }
  return {
    type: types.INVENTORY_REAGENT_HEALTH,
    deviceId,
    consumableId,
  }
}

module.exports = {
  types,
  inventoryReagentHealth,
}
