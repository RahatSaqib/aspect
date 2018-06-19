const { addDays, format } = require('date-fns')

// ----------- Action Types ---------------------
const types = {
  INVENTORY_STOCKOUT: 'INVENTORY_STOCKOUT',
  INVENTORY_STOCK_EXPIRING: 'INVENTORY_STOCK_EXPIRING',
  INVENTORY_REAGENT_HEALTH: 'INVENTORY_REAGENT_HEALTH',
}

// ----------- Action Creators -------------------

/**
 * Is called when inventory if going out-of-stock in [daysDue]
 */
function inventoryStockout(siteId, consumableId, daysDue) {
  if (!siteId || !consumableId || daysDue == null) {
    throw new Error('Must specify siteId, consumableId, daysDue')
  }

  const date = format(addDays(new Date(), daysDue), 'YYYY-MM-DD')

  return {
    type: types.INVENTORY_STOCKOUT,
    siteId,
    consumableId,
    daysDue,
    options: { date, daysDue },
  }
}

/**
 * Is called when inventory stock is expiring in [daysDue] with [totalWasted] wasted items
 */
function inventoryStockExpiring(siteId, consumableId, daysDue, totalWasted) {
  if (!siteId || !consumableId || daysDue == null || totalWasted == null) {
    throw new Error('Must specify siteId, consumableId, daysDue, totalWasted')
  }

  const date = format(addDays(new Date(), daysDue), 'YYYY-MM-DD')

  return {
    type: types.INVENTORY_STOCK_EXPIRING,
    siteId,
    consumableId,
    daysDue,
    totalWasted,
    options: { date, daysDue, totalWasted },
  }
}

/**
 * Creates an action to notify the inventory
 * has a reagent health issue
 *
 * deviceId, consumableId is required.
 */
function inventoryReagentHealth(deviceId, consumableId) {
  if (!deviceId || !consumableId) {
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
  inventoryStockout,
  inventoryStockExpiring,
  inventoryReagentHealth,
}
