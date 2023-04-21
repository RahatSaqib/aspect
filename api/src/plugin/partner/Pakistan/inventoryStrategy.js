const _ = require('lodash')
const Boom = require('@hapi/boom')

const { logInventoryChange } = require('../../../inventory/common/db')
const { allConsumableReasonToId } = require('../../../shared/dictionary')

// ----------------------------------------------------------------------------------
async function getNewQuantityOnHand(
  /**
   * param `knex` should be in transaction because in below func we may auto-transfer inventory
   * from warehouse to current site
   */
  knex,
  inventoryItem,
  operation,
  quantity,
  { resultId, userId } = {}
) {
  const now = new Date()
  const { quantityOnHand = 0 } = inventoryItem || {}
  const items = [
    {
      quantityOnHand,
      /**
       * notice that we return same `inventoryItem` - in case if it `undefined` then
       * we insert new inventoryItem, if not - we update it.
       * i.e. see func `changeInventoryQuantity` in `api/src/inventory/utils.js`
       * where we call func `upsertInventoryItem`
       */
      inventoryItem,
    },
  ]
  switch (operation) {
    case 'add from GxConnect':
    case 'remove from GxConnect':
      items[0].quantityOnHand = quantity
      break
    case 'add':
    case 'receive':
    case 'transfer received':
      items[0].quantityOnHand += quantity
      break
    case 'remove':
    case 'transfer':
    case 'transfer sent':
      /**
       * see ASP-5543 with rules for below code
       */
      if (_.isEmpty(inventoryItem)) {
        return Boom.notFound('Can not deduct from non-existed inventory item')
      }
      if (quantityOnHand < 0) {
        return Boom.notFound(
          `quantityOnHand is negative ${quantityOnHand} for current inventoryItemId=${inventoryItem.id}`
        )
      }
      if (quantityOnHand >= quantity) {
        /**
         * normal mode - deduct `quantity` from current site
         */
        items[0].quantityOnHand -= quantity
      } else {
        // how many items we need to transfer from warehouse
        quantity -= quantityOnHand
        // reset quantityOnHand for current site
        items[0].quantityOnHand = 0
        /**
         * transfer items from warehouse
         */
        const { consumableId, siteId, lotNumber, expiresOn } = inventoryItem
        // check if current site has parent one which is warehouse
        const warehouseSite = await knex('Site as s')
          .join('Site as wh', 's.parentWarehouseId', 'wh.id')
          .where('s.id', siteId)
          /**
           * TODO: check if we need to require parent site to be `warehouse`.
           * For now - don't require that
           * // .join('SiteType as st', 'wh.siteTypeId', 'st.id')
           * // .where('st.externalId', 'warehouse')
           */
          .first('wh.*')
        if (!warehouseSite) {
          await logMissingInventory(knex, inventoryItem, resultId, userId)
          return Boom.notFound('Warehouse does not exist to remove inventory items from it')
        }
        // get quantityOnHand from warehouse for same consumableId-lotNumber-expiresOn
        const inventoryItemWarehouse = await knex('InventoryItem as ii')
          .where({
            siteId: warehouseSite.id,
            // same params as in inventoryItem in current site
            consumableId,
            lotNumber,
            expiresOn,
          })
          .first()
        if (!inventoryItemWarehouse) {
          await logMissingInventory(knex, inventoryItem, resultId, userId)
          return Boom.notFound(
            `No inventory item found in warehouse siteId=${warehouseSite.id} to transfer to siteId=${siteId}`
          )
        }
        const { quantityOnHand: quantityOnHandWH } = inventoryItemWarehouse
        if (quantityOnHandWH < quantity) {
          await logMissingInventory(knex, inventoryItemWarehouse, resultId, userId)
          return Boom.notFound('Not enough inventory items in warehouse to transfer')
        }
        /**
         * auto transfer `quantity` items from warehouse to current site
         * by inserting record in InventoryLog
         */
        const { 'Transfer Sent': transferSentReasonId } = await allConsumableReasonToId()
        await logInventoryChange({
          knex,
          inventoryItemId: inventoryItemWarehouse.id,
          consumableId,
          siteId: inventoryItemWarehouse.siteId, // warehouse site
          resultId,
          lotNumber,
          expiresOn,
          createdOn: now,
          createdBy: userId,
          quantity,
          operation: `transfer`,
          referencedSiteId: siteId, // destination site (i.e. inventoryItem.siteId)
          consumableReasonId: transferSentReasonId,
          adjustedFrom: now,
          adjustedTo: now,
          notes: `auto transfer from warehouse siteId=${inventoryItemWarehouse.siteId} to siteId=${siteId}`,
          // important to mark this log entry with this flag
          isAutomatic: true,
        })
        /**
         * warehouse mode - deduct `quantity` from warehouse `quantityOnHand`
         */
        items.push({
          inventoryItem: inventoryItemWarehouse,
          quantityOnHand: quantityOnHandWH,
        })
        items[1].quantityOnHand -= quantity
        /**
         * after successfully transferred items from warehouse to the current site -
         * remove previously created entry from MissingInventoryLots, if any exist
         */
        await knex('MissingInventoryLots')
          .where({
            // resultId, // <--- TODO: may be narrow scope for current resultId?
            expirationDate: expiresOn,
            lotNumber,
            siteId,
          })
          .del()
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
