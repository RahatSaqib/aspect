const _ = require('lodash')

// ----------------------------------------------------------------------------------
async function getNewQuantityOnHand(knex, inventoryItem, operation, quantityOnHand, quantity) {
  let newQuantityOnHand = inventoryItem?.quantityOnHand || 0

  switch (operation) {
    case 'add':
    case 'add from GxConnect':
    case 'receive':
    case 'receive to':
    case 'transfer received':
      newQuantityOnHand = _.isUndefined(quantityOnHand) ? newQuantityOnHand + quantity : quantityOnHand
      break
    case 'remove':
    case 'remove from GxConnect':
    case 'transfer':
    case 'transfer sent':
    case 'transfer from':
      /**
       * this allows negative numbers for `quantityOnHand` -
       * see `api/src/plugin/partner/Pakistan/inventoryStrategy.js` for another implementation
       * which takes into account parent warehouse(s) and doesn't allow negative number
       */
      newQuantityOnHand = _.isUndefined(quantityOnHand) ? newQuantityOnHand - quantity : quantityOnHand
      break
    default: {
      // do not change quantityOnHand
    }
  }
  // return items
  return newQuantityOnHand
}

let currentUserId
function setUserId(userId) {
  currentUserId = userId
}

function getUserId() {
  return currentUserId
}

/**
 * when inventory is being transferred - do it in 2 steps:
 * - process `transferInventory` and set `inTransitFromSiteId` for inventory for `toSiteId`
 * - process `receiveInventory` and update both `fromSite` and `toSite` and release `inTransitFromSiteId`
 */
const transferInPendingMode = true

module.exports = {
  getNewQuantityOnHand,
  transferInPendingMode,
  setUserId,
  getUserId,
}
