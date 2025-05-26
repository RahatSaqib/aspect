const { getConstraints } = require('../auth/constraints')
const { getReconciliationList } = require('./common/db')
const { getUser } = require('../auth/service')
const { consumeInventoryForResult } = require('./consumeInventoryForResult')
const { getMissingInventoryToReconcile } = require('./missingInventoryLotsResolver')
const { transact } = require('../db')

async function autoReconcile(request) {
  const { auth, payload, plugins } = request
  const { partnerId } = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)
  // TODO: remove hardcoded size
  const [, data] = await getReconciliationList({ payload, size: 30000 }, dataConstraints)
  const messageContext = plugins?.messageContext || messageContext
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
      const { resultId, assayId, startedOn, lotNumber, expirationDate } = missingInventory

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
          messageContext,
          userId: null,
        })

        if (!consumableResults.some(res => !res.ok)) {
          // Change result to reconciled
          await knex('Result').where('id', resultId).update({
            reconciliationDate: new Date(),
          })
        }
      })
    }
  }
  return { ok: true }
}

module.exports = {
  autoReconcile,
}
