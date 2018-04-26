import _ from 'lodash'
// ----------- Action Types ---------------------
const types = {
  INVENTORY_COUNT_CHANGED: 'INVENTORY_COUNT_CHANGED',
  INVENTORY_STOCKOUT: 'INVENTORY_STOCKOUT',
  INVENTORY_STOCKOUT_ESCALATED: 'INVENTORY_STOCKOUT_ESCALATED',
  INVENTORY_STOCK_EXPIRING: 'INVENTORY_STOCK_EXPIRING',
  INVENTORY_STOCK_EXPIRING_ESCALATED: 'INVENTORY_STOCK_EXPIRING_ESCALATED',
}

// ----------- Action Creators -------------------

/**
 * Is called after Inventory has changed on adding, removing or trasfering
 */
function inventoryCountChanged(siteId, consumableId) {
  if (_.isNil(siteId) || _.isNil(consumableId)) {
    throw new Error('Must specify both siteId and consumableId')
  }

  return {
    type: types.INVENTORY_COUNT_CHANGED,
    siteId,
    consumableId,
  }
}

/**
 * Is called when inventory if going out-of-stock in [daysLeft]
 */
function inventoryStockout({ siteId, consumableId, daysLeft }) {
  return act(siteId, consumableId, daysLeft, types.INVENTORY_STOCKOUT)
}
function inventoryStockoutEscalated({ siteId, consumableId, daysLeft }) {
  return act(siteId, consumableId, daysLeft, types.INVENTORY_STOCKOUT_ESCALATED)
}

/**
 * Is called by scheduler when checking expiration dates of all inventory types in all sites
 */
function inventoryStockExpiring({ siteId, consumableId, daysLeft }) {
  return act(siteId, consumableId, daysLeft, types.INVENTORY_STOCK_EXPIRING)
}
function inventoryStockExpiringEscalated({ siteId, consumableId, daysLeft }) {
  return act(
    siteId,
    consumableId,
    daysLeft,
    types.INVENTORY_STOCK_EXPIRING_ESCALATED
  )
}

// ----------- Helpers ---------------------------

function act(siteId, consumableId, daysLeft, type) {
  if (
    _.isNil(siteId) ||
    _.isNil(consumableId) ||
    _.isNil(daysLeft) ||
    _.isNil(type)
  ) {
    throw new Error('Must specify siteId, consumableId, daysLeft and type')
  }

  return { type, siteId, consumableId, daysLeft }
}

// -----------------------------------------------

module.exports = {
  types,
  inventoryCountChanged,

  inventoryStockout,
  inventoryStockoutEscalated,

  inventoryStockExpiring,
  inventoryStockExpiringEscalated,
}
