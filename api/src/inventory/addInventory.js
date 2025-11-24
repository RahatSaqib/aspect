const Boom = require('@hapi/boom')

const { getUser } = require('../auth/service')

const { transact } = require('../db')
const { getSite } = require('../site/service')
const { updateSiteConsumable } = require('../site/common/db')
const { getConstraints } = require('../auth/constraints')
const { consumableReasonToId } = require('../shared/dictionary')

const { getInventoryItem, getConsumableStrategy } = require('./common/db')
const { INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY } = require('./common/querySelectors')
const { changeInventoryQuantity } = require('./common/logic')
const { parseDateOrDefault } = require('../shared/date')

module.exports = async function (request) {
  const { auth, payload, plugins } = request

  const now = new Date()
  const quantity = Math.abs(payload.quantity)
  const { toSiteId, consumableId, expiresOn, lotNumber, reasonId, dateAdjusted, notes, resultId } = payload
  const dataConstraints = await getConstraints(auth.credentials)
  const toSite = await getSite(toSiteId, dataConstraints)
  if (!toSite) {
    return Boom.forbidden('You are not permitted to add inventory to this site')
  }
  const { id: userId, partnerId } = await getUser(auth.credentials.name)
  const consumableReasonId = reasonId || (await consumableReasonToId('manual_addition'))

  /**
   * take 1st item from returning array of affected items
   */
  const res = await transact(async knex => {
    const res = await changeInventoryQuantity(knex, {
      consumableId,
      siteId: toSite.id,
      lotNumber,
      expiresOn,
      quantity,
      now,
      userId,
      partnerId,
      plugins, // for getting messageContext
      consumableReasonId,
      transactionDate: dateAdjusted,
      notes,
      resultId,
    })

    if (!res.ok) {
      return res
    }

    await updateSiteConsumable(knex, toSite.id, { modify: 'add', consumableId })

    const physicalCountConsumableReasonId = await consumableReasonToId('physical_count')
    if (consumableReasonId === physicalCountConsumableReasonId) {
      await updateResultsToReconciled(knex, {
        toSite,
        consumableId,
        partnerId,
        lotNumber,
        expiresOn,
      })
    }

    return res
  })

  if (!res.ok) {
    return Boom.badRequest(res.errorMessage, { errorKeyCode: res.error })
  }

  const data = await getInventoryItem(res.inventoryItemId, INVENTORY_ITEM_SELECT_WITHOUT_STRATEGY)
  return {
    ok: true,
    data,
  }
}

async function updateResultsToReconciled(knex, { toSite, consumableId, partnerId, lotNumber, expiresOn }) {
  const consumableStrategy = await getConsumableStrategy(partnerId)
  const qb = knex('Result as r').join('ConsumableAssay as ca', 'ca.assayId', 'r.assayId').where({
    'r.siteId': toSite.id,
    'ca.consumableId': consumableId,
  })

  consumableStrategy
    .filterFields({
      lotNumberField: { 'r.consumableLot': lotNumber },
      expiresOnField: { 'r.consumableExpirationDate': parseDateOrDefault(expiresOn) || null },
    })
    .forEach(condition => {
      qb.where(condition)
    })

  await qb.update({
    reconciliationDate: new Date(),
  })
}
