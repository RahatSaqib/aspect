const isNil = require('lodash/isNil')
// ----------- Action Types ---------------------
const types = {
  INVENTORY_STOCKOUT: 'INVENTORY_STOCKOUT',
  INVENTORY_STOCK_EXPIRING: 'INVENTORY_STOCK_EXPIRING',
}

// ----------- Action Creators -------------------

/**
 * Is called when inventory if going out-of-stock in [daysDue]
 */
function inventoryStockout(siteId, consumableId, daysDue) {
  if (isNil(siteId) || isNil(consumableId) || isNil(daysDue)) {
    throw new Error('Must specify siteId, consumableId, daysDue')
  }

  return {
    type: types.INVENTORY_STOCKOUT,
    siteId,
    consumableId,
    daysDue,
  }
}

/**
 * Is called when inventory stock is expiring in [daysDue] with [totalWasted] wasted items
 */
function inventoryStockExpiring(siteId, consumableId, daysDue, totalWasted) {
  if (
    isNil(siteId) ||
    isNil(consumableId) ||
    isNil(daysDue) ||
    isNil(totalWasted)
  ) {
    throw new Error('Must specify siteId, consumableId, daysDue, totalWasted')
  }

  return {
    type: types.INVENTORY_STOCK_EXPIRING,
    siteId,
    consumableId,
    daysDue,
    totalWasted,
  }
}

// -----------------------------------------------

module.exports = {
  types,
  inventoryStockout,
  inventoryStockExpiring,
}
