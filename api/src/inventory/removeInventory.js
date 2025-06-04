const Boom = require('@hapi/boom')

const { getUser } = require('../auth/service')

const { transact } = require('../db')
const { getSite } = require('../site/service')
const { getConstraints } = require('../auth/constraints')

const { getInventoryItem } = require('./common/db')
const { changeInventoryQuantity } = require('./common/logic')

module.exports = async function (request) {
  const { auth, payload, plugins } = request

  const now = new Date()
  const quantity = Math.abs(payload.quantity)
  const { fromSiteId, consumableId, expiresOn, lotNumber, reasonId, dateAdjusted, notes, resultId } = payload
  const dataConstraints = await getConstraints(auth.credentials)
  const fromSite = await getSite(fromSiteId, dataConstraints)
  if (!fromSite) {
    return Boom.forbidden('You are not permitted to remove inventory from this site')
  }
  const { id: userId, partnerId } = await getUser(auth.credentials.name)

  const res = await transact(async knex =>
    changeInventoryQuantity(knex, {
      consumableId,
      siteId: fromSite.id,
      lotNumber,
      expiresOn,
      quantity,
      now,
      userId,
      partnerId,
      plugins, // for getting messageContext
      consumableReasonId: reasonId,
      transactionDate: dateAdjusted,
      notes,
      resultId,
    })
  )
  if (!res.ok) {
    return Boom.badRequest(res.errorMessage, { errorKeyCode: res.error })
  }
  const data = await getInventoryItem(res.inventoryItemId)

  return {
    ok: true,
    data,
  }
}
