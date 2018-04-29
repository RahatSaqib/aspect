const _ = require('lodash')
// ----------- Action Types ---------------------
const types = {
  INVENTORY_STOCK_CHANGED: 'INVENTORY_STOCK_CHANGED',
  INVENTORY_RECALCULATE_CONSUMPTION_RATES:
    'INVENTORY_RECALCULATE_CONSUMPTION_RATES',

  INVENTORY_STOCKOUT: 'INVENTORY_STOCKOUT',
  INVENTORY_STOCKOUT_ESCALATED: 'INVENTORY_STOCKOUT_ESCALATED',

  INVENTORY_STOCK_EXPIRING: 'INVENTORY_STOCK_EXPIRING',
  INVENTORY_STOCK_EXPIRING_ESCALATED: 'INVENTORY_STOCK_EXPIRING_ESCALATED',
}

// ----------- Action Creators -------------------

/**
 * Is called after Inventory has changed on adding, removing or trasfering
 */
function inventoryStockChanged(siteId, consumableId) {
  if (_.isNil(siteId) || _.isNil(consumableId)) {
    throw new Error('Must specify both siteId and consumableId')
  }

  return {
    type: types.INVENTORY_STOCK_CHANGED,
    siteId,
    consumableId,
  }
}

/**
 * Is called after new result arrived
 */
function inventoryRecalculateConsumptionRates(siteId, consumableId) {
  return {
    type: types.INVENTORY_RECALCULATE_CONSUMPTION_RATES,
    siteId,
    consumableId,
  }
}

/**
 * Is called by scheduler when inventory if going out-of-stock in [daysDue]
 */
function inventoryStockout({ siteId, consumableId, daysDue }) {
  return act(siteId, consumableId, daysDue, types.INVENTORY_STOCKOUT)
}
function inventoryStockoutEscalated({ siteId, consumableId, daysDue }) {
  return act(siteId, consumableId, daysDue, types.INVENTORY_STOCKOUT_ESCALATED)
}

/**
 * Is called by scheduler when inventory stock is expiring in [daysDue]
 */
function inventoryStockExpiring({ siteId, consumableId, daysDue }) {
  return act(siteId, consumableId, daysDue, types.INVENTORY_STOCK_EXPIRING)
}
function inventoryStockExpiringEscalated({ siteId, consumableId, daysDue }) {
  return act(
    siteId,
    consumableId,
    daysDue,
    types.INVENTORY_STOCK_EXPIRING_ESCALATED
  )
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

// -----------------------------------------------

module.exports = {
  types,
  inventoryRecalculateConsumptionRates,
  inventoryStockChanged,

  inventoryStockout,
  inventoryStockoutEscalated,

  inventoryStockExpiring,
  inventoryStockExpiringEscalated,
}
