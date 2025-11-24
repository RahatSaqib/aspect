const Boom = require('@hapi/boom')
const { getUser } = require('../auth/service')
const { transact } = require('../db')
const { getSite } = require('../site/service')
const { getConstraints } = require('../auth/constraints')
const { consumableReasonToId } = require('../shared/dictionary')
const { getInventoryItem } = require('./common/db')
const { changeInventoryQuantity } = require('./common/logic')

module.exports = async function (request) {
  const { auth, payload, plugins } = request

  const now = new Date()

  const { siteId, consumableId, lotNumber, quantity, dateAdjusted, notes, expiresOn } = payload

  const dataConstraints = await getConstraints(auth.credentials)
  const site = await getSite(siteId, dataConstraints)
  if (!site) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }

  const { id: userId, partnerId } = await getUser(auth.credentials.name)

  const consumableReasonId =
    quantity > 0 ? await consumableReasonToId('manual_addition') : await consumableReasonToId('other')

  const res = await transact(async knex =>
    changeInventoryQuantity(knex, {
      consumableId,
      siteId,
      lotNumber,
      expiresOn,
      /**
       * make sure `quantity` is positive, because we add (quantityOnHand + quantity) or
       * remove (quantityOnHand - quantity) based on `ConsumableReason.effectOnStock`. And if `quantity` remains
       * negative for `remove` - then we increase instead of decreasing.
       */
      quantity: Math.abs(quantity),
      now,
      userId,
      partnerId,
      plugins, // for getting messageContext
      consumableReasonId,
      transactionDate: dateAdjusted,
      notes,
    })
  )
  if (!res.ok) {
    return Boom.badRequest(res.errorMessage, { errorKeyCode: res.error })
  }
  return getInventoryItem(res.inventoryItemId)
}
