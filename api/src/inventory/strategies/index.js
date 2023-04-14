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
       * this allows negative numbers for `quantityOnHand` -
       * see `api/src/plugin/partner/Pakistan/inventoryStrategy.js` for another implementation
       * which takes into account parent warehouse(s) and doesn't allow negative number
       */
      items[0].quantityOnHand -= quantity
      break
    default: {
      // do not change quantityOnHand
    }
  }
  return items
}

module.exports = {
  getNewQuantityOnHand,
}
