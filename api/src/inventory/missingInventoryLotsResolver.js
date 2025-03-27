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
      knex.raw('m.lotNumber'),
    ])
    .clone()

const getMissingInventoryToReconcile = (siteId, consumableId, expirationDate, lotNumber) =>
  getMissingInventoryBaseQuery()
    .where(qb => {
      qb.where('m.siteId', siteId).andWhere('ca.consumableId', consumableId)
      if (expirationDate) {
        qb.andWhere(knex.raw('DATE(m.expirationDate) <=> DATE(:expirationDate)', { expirationDate }))
      }

      if (lotNumber) {
        qb.andWhere('m.lotNumber', lotNumber)
      }
    })
    .select([
      'm.id as missingInventoryLotId',
      'r.id as resultId',
      'r.assayId',
      'r.endedOn',
      'r.startedOn',
      knex.raw('DATE(m.expirationDate) as expirationDate'),
      knex.raw('m.lotNumber'),
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
      const { missingInventoryLotId, resultId, assayId, startedOn, endedOn, lotNumber, expirationDate } = missingInventory

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
}

module.exports = {
  missingInventoryLotsResolver,
  getMissingInventoryToReconcile,
}
