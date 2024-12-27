const { get } = require('lodash')
const Boom = require('@hapi/boom')
const { knex, transact } = require('../db')
const { consumeInventoryForResult } = require('./common/logic')

const getMissingInventoryBaseQuery = () =>
  knex('MissingInventoryLots as m')
    .innerJoin('Result as r', 'm.resultId', 'r.id')
    .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .clone()

const getMissingInventoryGroups = () =>
  getMissingInventoryBaseQuery()
    .innerJoin('Site as s', 'm.siteId', 's.id')
    .leftJoin('Site as pa', 's.parentWarehouseId', 'pa.id')
    .groupBy(['siteId', 'consumableId', knex.raw('DATE(expirationDate)')])
    .select([
      'r.partnerId',
      'm.siteId',
      's.parentWarehouseId',
      'ca.consumableId',
      knex.raw('DATE(m.expirationDate) as expirationDate'),
    ])
    .clone()

const getMissingInventoryToReconcile = (siteId, consumableId, expirationDate) =>
  getMissingInventoryBaseQuery()
    .where(qb =>
      qb
        .where('m.siteId', siteId)
        .andWhere('ca.consumableId', consumableId)
        .andWhere(knex.raw('DATE(m.expirationDate) <=> DATE(:expirationDate)', { expirationDate }))
    )
    .select([
      'm.id as missingInventoryLotId',
      'r.id as resultId',
      'r.assayId',
      'r.endedOn',
      'r.startedOn',
      knex('DeviceLog')
        .where('resultId', knex.ref('r.id'))
        .select('rawMessage')
        .orderBy('createdOn', 'desc')
        .limit(1)
        .as('payload'),
    ])
    .clone()

const missingInventoryLotsResolver = async (_, { messageContext }) => {
  const missingInventoryGroups = await getMissingInventoryGroups()
  /* eslint-disable no-await-in-loop */
  for (const missingInventoryGroup of missingInventoryGroups) {
    const { partnerId, siteId, consumableId, expirationDate } = missingInventoryGroup

    // We should get all the InventoryMissingLots limited by the quantityToReconcile and ordered by result.endedOn
    const missingInventoryToReconcile = await getMissingInventoryToReconcile(
      siteId,
      consumableId,
      expirationDate
    ).orderBy('r.endedOn')

    for (const missingInventory of missingInventoryToReconcile) {
      const { missingInventoryLotId, resultId, assayId, startedOn, endedOn, payload } = missingInventory
      const consumables = get(JSON.parse(payload), 'result.consumable') || []

      await transact(async knex => {
        const consumableResults = await consumeInventoryForResult({
          resultId,
          assayId,
          siteId,
          consumablesInResultData: consumables,
          partnerId,
          testStartedOn: startedOn,
          testEndedOn: endedOn,
          knex,
          messageContext,
          userId: null,
          isUnreconciledResult: true,
        })

        if (!consumableResults.some(s => Boom.isBoom(s) || !s)) {
          // Delete missingInventoryLots entry
          await knex('MissingInventoryLots as m').where('id', missingInventoryLotId).delete()
        }
      })
    }
  }
}

module.exports = {
  missingInventoryLotsResolver,
}
