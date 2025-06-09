const _ = require('lodash')
const Boom = require('@hapi/boom')

const { getUser } = require('../auth/service')

const { knex, transact } = require('../db')
const { getSite } = require('../site/service')
const { updateSiteConsumable } = require('../site/common/db')
const { getConstraints } = require('../auth/constraints')
const { consumableReasonToId } = require('../shared/dictionary')

const { INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY } = require('./common/querySelectors')
const { transferInPendingMode, validateAndDetermineNewQuantity, upsertInventoryItemAndLog } = require('./common/logic')
const { findInventoryItem, getInventoryItem, updateInventoryTransfer } = require('./common/db')

module.exports = async function (request) {
  const {
    auth,
    payload: { fromSiteId, toSiteId, consumableId, expiresOn, lotNumber, quantity, dateAdjusted, notes },
  } = request

  const dataConstraints = await getConstraints(auth.credentials)
  const toSite = await getSite(toSiteId, dataConstraints)
  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }
  /**
   * using inventory strategy get quantityOnHand for destination sites
   */
  const { partnerId } = await getUser(auth.credentials.name)
  if (!transferInPendingMode) {
    return Boom.badRequest(
      'Inventory strategy does not allow pending mode for transferring inventory - it has been already processed in transferInventory'
    )
  }
  const consumableReasonId = await consumableReasonToId('transfer_received')
  const inventoryItem = await findInventoryItem(knex, {
    siteId: toSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    partnerId,
  })
  const destination = await validateAndDetermineNewQuantity({
    inventoryItem,
    consumableReasonId,
    transactionDate: dateAdjusted,
    quantity,
  })
  if (!destination.ok) {
    return destination
  }

  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const now = new Date()
  const inTransitInventoryItem = await findInventoryItem(knex, {
    siteId: toSiteId,
    consumableId,
    expiresOn,
    lotNumber,
    inTransitFromSiteId: fromSiteId,
    partnerId,
  })
  if (_.isEmpty(inTransitInventoryItem)) {
    return Boom.badRequest('Could not find source item')
  }

  const destinationInventoryItemId = await transact(async knex => {
    const { inventoryItemId, inventoryLogId } = await upsertInventoryItemAndLog(knex, {
      inventoryItemId: inventoryItem?.id,
      quantityOnHand: destination.quantityOnHand,
      quantityToLog: destination.quantityToLog,
      siteId: toSiteId,
      consumableId,
      consumableReasonId,
      lotNumber,
      expiresOn,
      now,
      userId: currentlyLoggedInUser.id,
      transactionDate: dateAdjusted,
      notes,
      referencedSiteId: fromSiteId,
    })

    await updateSiteConsumable(knex, toSiteId, { modify: 'add', consumableId })

    await updateInventoryTransfer(knex, inTransitInventoryItem.id, inventoryLogId)

    await knex('InventoryItem').where('id', inTransitInventoryItem.id).delete()

    return inventoryItemId
  })
  const data = await getInventoryItem(destinationInventoryItemId, INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY)

  return {
    ok: true,
    data,
  }
}
