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
 * siteId, consumableId is required.
 */
function inventoryReagentHealth(siteId, consumableId) {
  if (_.isNil(siteId) || _.isNil(consumableId)) {
    throw new Error('Must specify siteId, consumableId')
  }
  return {
    type: types.INVENTORY_REAGENT_HEALTH,
    siteId,
    consumableId,
  }
}

module.exports = {
  types,
  inventoryReagentHealth,
}
