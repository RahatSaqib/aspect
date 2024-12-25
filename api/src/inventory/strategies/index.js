const _ = require('lodash')
const Boom = require('@hapi/boom')

// ----------------------------------------------------------------------------------
async function getNewQuantityOnHand(
  knex,
  inventoryItem,
  operation,
  quantityOnHand,
  quantity,
  { resultId, userId, isUnreconciledResult } = {}
) {
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
      if (resultId)
        if (inventoryItem && inventoryItem.quantityOnHand >= quantity) {
          /**
           * normal mode - deduct `quantity` from current site
           */
          newQuantityOnHand -= quantity
        } else if (!isUnreconciledResult) {
          // log missing lots only for results, and not for manual changes
          await logMissingInventory(knex, resultId, userId)
        } else {
          /**
           * normal mode - deduct `quantity` from current site
           */
          // case of ui operation
          if (_.isUndefined(quantityOnHand)) {
            if (!inventoryItem) {
              return Boom.notFound('Can not deduct from non-existed inventory item', { errorKeyCode: 'notExisted' })
            }
            if (inventoryItem.quantityOnHand < 0) {
              return Boom.notFound(
                `quantityOnHand is negative ${inventoryItem.quantityOnHand} for current inventoryItemId=${inventoryItem.id}`,
                { errorKeyCode: 'negativeQuantity' }
              )
            }
            if (inventoryItem.quantityOnHand < quantity) {
              return Boom.notFound(
                `Not enough inventory items (${inventoryItem.quantityOnHand}) on the site to remove ${quantity} items`,
                { errorKeyCode: 'notEnoughInventory' }
              )
            }
          }
          newQuantityOnHand = _.isUndefined(quantityOnHand) ? newQuantityOnHand - quantity : quantityOnHand
        }
      break
    default: {
      // do not change quantityOnHand
    }
  }
  // return items
  return { newQuantityOnHand }
}

let currentUserId
function setUserId(userId) {
  currentUserId = userId
}

function getUserId() {
  return currentUserId
}

// ----------------------------------------------------------------------------------
async function logMissingInventory(knex, resultId, userId) {
  const now = new Date()

  const { siteId, lotNumber, expiresOn } = await knex('Result as r')
    .where({ id: resultId })
    .first('siteId', 'consumableLot as lotNumber', 'consumableExpirationDate as expiresOn')
  await knex('MissingInventoryLots').insert({
    resultId,
    expirationDate: expiresOn,
    lotNumber,
    siteId,
    createdOn: now,
    createdBy: userId,
  })
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
