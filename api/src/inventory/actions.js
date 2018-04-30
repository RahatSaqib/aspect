const _ = require('lodash')
// ----------- Action Types ---------------------
const types = {
  INVENTORY_STOCKOUT: 'INVENTORY_STOCKOUT',
  INVENTORY_STOCK_EXPIRING: 'INVENTORY_STOCK_EXPIRING',
}

// ----------- Helpers ---------------------------

function act(siteId, consumableId, daysDue, type) {
  if (
    _.isNil(siteId) ||
    _.isNil(consumableId) ||
    _.isNil(daysDue) ||
    _.isNil(type)
  ) {
    throw new Error('Must specify siteId, consumableId, daysDue and type')
  }

  return { type, siteId, consumableId, daysDue }
}

// ----------- Action Creators -------------------

/**
 * Is called when inventory if going out-of-stock in [daysDue]
 */
function inventoryStockout({ siteId, consumableId, daysDue }) {
  return act(siteId, consumableId, daysDue, types.INVENTORY_STOCKOUT)
}

/**
 * Is called when inventory stock is expiring in [daysDue]
 */
function inventoryStockExpiring({ siteId, consumableId, daysDue }) {
  return act(siteId, consumableId, daysDue, types.INVENTORY_STOCK_EXPIRING)
}

// -----------------------------------------------

module.exports = {
  types,
  inventoryStockout,
  inventoryStockExpiring,
}
