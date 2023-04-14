const _ = require('lodash')
const Boom = require('@hapi/boom')

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
        return Boom.notFound('Can not deduct from not-existed inventory item')
      }
      if (quantityOnHand < quantity) {
        /**
         * get quantityOnHand from warehouse
         */
        /**
         * deduct rest from warehouse
         */
        /**
         * get `inventoryItem` and `quantityOnHand` from warehouse
         */
        /**
         * if warehouse also doesn't have `quantityOnHand` then return error
         */
        // return Boom.notFound('Not enough inventories to deduct')
      } else {
        /**
         * normal mode - deduct `quantity` and `quantityOnHand` is not negative
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

module.exports = {
  /**
   * below funcs overwrite default funcs exported from `/inventory/strategies/index.js`
   */
  getNewQuantityOnHand,
}
