const _ = require('lodash')
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
  if (_.isNil(siteId) || _.isNil(consumableId) || _.isNil(daysDue)) {
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
 * Is called when inventory stock is expiring in [daysDue]
 */
function inventoryStockExpiring(siteId, consumableId, daysDue) {
  if (_.isNil(siteId) || _.isNil(consumableId) || _.isNil(daysDue)) {
    throw new Error('Must specify siteId, consumableId, daysDue')
  }

  return {
    type: types.INVENTORY_STOCK_EXPIRING,
    siteId,
    consumableId,
    daysDue,
  }
}

// -----------------------------------------------

module.exports = {
  types,
  inventoryStockout,
  inventoryStockExpiring,
}
