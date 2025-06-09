const { knex, transact } = require('../db')
const { consumeInventoryForResult } = require('./consumeInventoryForResult')

const getUnreconciledResultsBaseQuery = () =>
  knex('Result as r')
    .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .whereNull('r.reconciliationDate')
    .clone()

const getMissingInventoryGroups = () =>
  getUnreconciledResultsBaseQuery()
    .innerJoin('Site as s', 'r.siteId', 's.id')
    .leftJoin('Site as pa', 's.parentWarehouseId', 'pa.id')
    .groupBy(['siteId', 'consumableId', knex.raw('DATE(r.consumableExpirationDate)')])
    .select([
      'r.partnerId',
      'r.siteId',
      's.parentWarehouseId',
      'ca.consumableId',
      knex.raw('DATE(r.consumableExpirationDate) as expirationDate'),
      knex.raw('r.consumableLot'),
    ])
    .clone()

const getMissingInventoryToReconcile = (siteId, consumableId, expirationDate, lotNumber) =>
  getUnreconciledResultsBaseQuery()
    .where(qb => {
      qb.where('r.siteId', siteId).andWhere('ca.consumableId', consumableId)
      if (expirationDate) {
        qb.andWhere(knex.raw('DATE(r.consumableExpirationDate) <=> DATE(:expirationDate)', { expirationDate }))
      }

      if (lotNumber) {
        qb.andWhere('r.consumableLot', lotNumber)
      }
    })
    .select([
      'r.id as resultId',
      'r.assayId',
      'r.startedOn',
      knex.raw('DATE(r.consumableExpirationDate) as expirationDate'),
      knex.raw('r.consumableLot as lotNumber'),
    ])
    .clone()

const missingInventoryLotsResolver = async (_, { messageContext }) => {
  const missingInventoryGroups = await getMissingInventoryGroups()
  /* eslint-disable no-await-in-loop */
  for (const missingInventoryGroup of missingInventoryGroups) {
    const { partnerId, siteId, consumableId, lotNumber, expirationDate } = missingInventoryGroup

    // We should get all the InventoryMissingLots limited by the quantityToReconcile and ordered by result.endedOn
    const missingInventoryToReconcile = await getMissingInventoryToReconcile(
      siteId,
      consumableId,
      expirationDate,
      lotNumber
    ).orderBy('r.endedOn')

    for (const missingInventory of missingInventoryToReconcile) {
      const { resultId, assayId, startedOn, lotNumber, expirationDate } = missingInventory

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
}

module.exports = {
  missingInventoryLotsResolver,
  getMissingInventoryToReconcile,
}
