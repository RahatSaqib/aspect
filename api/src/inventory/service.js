const { get } = require('lodash')
const Boom = require('@hapi/boom')
const { getConstraints } = require('../auth/constraints')
const { getReconciliationList } = require('./common/db')
const { getUser } = require('../auth/service')
const { consumeInventoryForResult } = require('./common/logic')
const { getMissingInventoryToReconcile } = require('./missingInventoryLotsResolver')
const { transact } = require('../db')

async function listReconciliation(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const [{ total }, data] = await getReconciliationList(query, dataConstraints)
  return { data, total, ok: true }
}

async function autoReconcile(request) {
  const { auth, payload } = request
  const { partnerId } = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)
  const [, data] = await getReconciliationList(payload, dataConstraints)
  /* eslint-disable no-await-in-loop */
  for (const missingInventoryGroup of data) {
    const {
      siteId,
      consumableId,
      expirationDate: expirationDateForFilter,
      lotNumber: lotNumberForFilter,
    } = missingInventoryGroup

    // We should get all the InventoryMissingLots limited by the quantityToReconcile and ordered by result.endedOn
    const missingInventoryToReconcile = await getMissingInventoryToReconcile(
      siteId,
      consumableId,
      expirationDateForFilter,
      lotNumberForFilter
    ).orderBy('r.endedOn')

    for (const missingInventory of missingInventoryToReconcile) {
      const { missingInventoryLotId, resultId, assayId, startedOn, endedOn, lotNumber, expirationDate } =
        missingInventory
      const consumables = get(JSON.parse(payload), 'result.consumable') || []
      // eslint-disable-next-line no-loop-func

      await transact(async knex => {
        const consumableResults = await consumeInventoryForResult({
          knex,
          resultId,
          assayId,
          siteId,
          partnerId,
          lotNumber,
          expirationDate,
          testStartedOn: startedOn,
          testEndedOn: endedOn,
          messageContext,
          userId: null,
        })

        if (!consumableResults.some(s => Boom.isBoom(s) || !s)) {
          // Delete missingInventoryLots entry
          await knex('MissingInventoryLots as m').where('id', missingInventoryLotId).delete()
        }
      })
    }
  }
  return { ok: true }
}

module.exports = {
  listReconciliation,
  autoReconcile,
}
