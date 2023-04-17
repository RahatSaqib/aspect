const _ = require('lodash')
const Boom = require('@hapi/boom')

const { knex } = require('../../../db')

// const defaultInventoryStrategy = require('../../../inventory/strategies')

// ----------------------------------------------------------------------------------
async function getNewQuantityOnHand(inventoryItem, operation, quantity) {
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
      if (quantityOnHand < quantity) {
        if (quantityOnHand > 0) {
          /**
           * decrease quantity to remove from warehouse smaller number
           * and reset quantityOnHand for current site
           */
          quantity -= quantityOnHand
          items[0].quantityOnHand = 0
        }
        const { consumableId, siteId, lotNumber, expiresOn } = inventoryItem
        /**
         * check if current site has parent one which is warehouse
         */
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
          return Boom.notFound('Warehouse does not exist to remove inventory items from it')
        }
        /**
         * get quantityOnHand from warehouse for same consumableId-lotNumber-expiresOn
         */
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
          return Boom.notFound('Can not remove inventory items from warehouse - inventory item does not exist')
        }
        const { quantityOnHand: quantityOnHandWH } = inventoryItemWarehouse
        if (quantityOnHandWH < quantity) {
          return Boom.notFound('Not enough inventory items in warehouse to remove')
        }
        /**
         * warehouse mode - deduct `quantity` from warehouse `quantityOnHand`
         */
        items.push({
          inventoryItem: inventoryItemWarehouse,
          quantityOnHand: quantityOnHandWH,
        })
        items[1].quantityOnHand -= quantity
      } else {
        /**
         * normal mode - deduct `quantity` from current site
         */
        items[0].quantityOnHand -= quantity
      }
      break
    default: {
      // do not change quantityOnHand
    }
  }
  return items
}

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
