const _ = require('lodash')
const Boom = require('@hapi/boom')

// const { logInventoryChange } = require('../../../inventory/common/db')
// const { allConsumableReasonToId } = require('../../../shared/dictionary')

// ----------------------------------------------------------------------------------
async function getNewQuantityOnHand(
  /**
   * param `knex` should be in transaction because in below func we may auto-transfer inventory
   * from warehouse to current site
   */
  knex,
  inventoryItem,
  operation,
  quantityOnHand,
  quantity,
  { resultId, userId } = {}
) {
  // const now = new Date()
  const items = [
    {
      quantityOnHand: inventoryItem?.quantityOnHand || 0,
      /**
       * notice that we return same `inventoryItem` - in case if is `undefined` then
       * we insert new inventoryItem, if not - we update it.
       * i.e. see func `changeInventoryQuantity` in `api/src/inventory/utils.js`
       * where we call func `upsertInventoryItem`
       */
      inventoryItem,
    },
  ]
  switch (operation) {
    case 'add':
    case 'add from GxConnect':
    case 'receive':
    case 'transfer received':
      items[0].quantityOnHand += quantity
      break
    case 'remove':
    case 'remove from GxConnect':
    case 'transfer':
    case 'transfer sent':
      /**
       * see ASP-5543 with rules for below code
       */
      if (_.isEmpty(inventoryItem)) {
        return Boom.notFound('Can not deduct from non-existed inventory item')
      }
      if (inventoryItem.quantityOnHand < 0) {
        return Boom.notFound(
          `quantityOnHand is negative ${inventoryItem.quantityOnHand} for current inventoryItemId=${inventoryItem.id}`
        )
      }

      if (inventoryItem.quantityOnHand >= quantity) {
        /**
         * normal mode - deduct `quantity` from current site
         */
        items[0].quantityOnHand -= quantity
      } else {
        await logMissingInventory(knex, inventoryItem, resultId, userId)
        return Boom.notFound(
          `Not enough inventory items (${inventoryItem.quantityOnHand}) on the site to remove ${quantity} items`
        )
      }
      break
    default: {
      // do not change quantityOnHand
    }
  }
  return items
}

// ----------------------------------------------------------------------------------
async function logMissingInventory(knex, inventoryItem, resultId, userId) {
  if (!resultId) {
    // log missing lots only for results, and not for manual changes
    return
  }
  const now = new Date()
  const { siteId, lotNumber, expiresOn } = inventoryItem
  await knex('MissingInventoryLots').insert({
    resultId,
    expirationDate: expiresOn,
    lotNumber,
    siteId,
    createdOn: now,
    createdBy: userId,
  })
}

// ----------------------------------------------------------------------------------
/**
 * when inventory is being transferred - do it in one shot in `transferInventory` func
 * without postponing receive commit and without setting inTransitFromSiteId field
 */
const transferInPendingMode = false

module.exports = {
  /**
   * below funcs overwrite default funcs exported from `/inventory/strategies/index.js`
   */
  getNewQuantityOnHand,
  transferInPendingMode,
}
