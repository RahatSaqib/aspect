const { get } = require('lodash')
const { startOfDay } = require('date-fns')
const { knex, transact } = require('../db')
const { consumeInventoryForResult, transferInventory } = require('./utils')

const getInventoryBaseQuery = () =>
  knex('InventoryItem')
    .whereNotNull('inTransitFromSiteId')
    .groupBy(['siteId', 'consumableId', 'expiresOn'])
    .select(['siteId', 'consumableId', 'expiresOn', knex.raw('IFNULL(SUM(quantityOnHand), 0) as total')])
    .clone()

const getMissingInventoryBaseQuery = () =>
  knex('MissingInventoryLots as m')
    .innerJoin('Result as r', 'm.resultId', 'r.id')
    .innerJoin('ConsumableAssay as ca', 'r.assayId', 'ca.assayId')
    .clone()

const getMissingInventoryGroups = getMissingInventoryBaseQuery()
  .innerJoin('Site as s', 'm.siteId', 's.id')
  .leftJoin('Site as pa', 's.parentWarehouseId', 'pa.id')
  .leftJoin(getInventoryBaseQuery().as('siteInventory'), qb =>
    qb
      .on('siteInventory.siteId', 's.id')
      .andOn('siteInventory.consumableId', 'ca.consumableId')
      .andOn(knex.raw('siteInventory.expiresOn <=> m.expirationDate'))
  )
  .leftJoin(getInventoryBaseQuery().as('warehouseInventory'), qb =>
    qb
      .on('warehouseInventory.siteId', 's.id')
      .andOn('warehouseInventory.consumableId', 'ca.consumableId')
      .andOn(knex.raw('warehouseInventory.expiresOn <=> m.expirationDate'))
  )
  .groupBy(['siteId', 'consumableId', 'expirationDate'])
  .select([
    'r.partnerId',
    'm.siteId',
    's.parentWarehouseId',
    'ca.consumableId',
    'm.expirationDate',
    knex.raw('COUNT(m.id) as totalRequiredInventory'),
    knex.raw('IFNULL(siteInventory.total, 0) as availableQuantityInSiteInventory'),
    knex.raw('IFNULL(warehouseInventory.total, 0) as availableQuantityInWarehouseInventory'),
  ])

const getMissingInventoryToReconcile = (siteId, consumableId, expirationDate) =>
  getMissingInventoryBaseQuery()
    .where(qb =>
      qb
        .where('m.siteId', siteId)
        .andWhere('ca.consumableId', consumableId)
        .andWhere(knex.raw('m.expirationDate <=> :expirationDate', { expirationDate }))
    )
    .select([
      'm.id as missingInventoryLotId',
      'r.id as resultId',
      'r.assayId',
      'r.endedOn',
      knex('DeviceLog')
        .where('resultId', knex.ref('r.id'))
        .select('rawMessage')
        .orderBy('createdOn', 'desc')
        .limit(1)
        .as('payload'),
    ])

const missingLotsResolver = async (_, plugins) => {
  const missingInventoryGroups = await getMissingInventoryGroups

  /* eslint-disable no-await-in-loop */
  for (const missingInventoryGroup of missingInventoryGroups) {
    const {
      partnerId,
      siteId,
      parentWarehouseId,
      consumableId,
      expirationDate,
      totalRequiredInventory,
      availableQuantityInSiteInventory,
      availableQuantityInWarehouseInventory,
    } = missingInventoryGroup

    // Calculate, if necessary, how many consumables should/can be transfered from the warehouse (consumablesToTransfer)
    const remainingRequiredQuantity = totalRequiredInventory - availableQuantityInSiteInventory
    const quantityToTransfer =
      remainingRequiredQuantity > 0 && availableQuantityInWarehouseInventory > 0
        ? Math.min(remainingRequiredQuantity, availableQuantityInWarehouseInventory)
        : 0
    const quantityToReconcile = Math.min(totalRequiredInventory, availableQuantityInSiteInventory) + quantityToTransfer

    // We should get all the InventoryMissingLots limited by the quantityToReconcile and ordered by result.endedOn
    const missingInventoryToReconcile = await getMissingInventoryToReconcile(siteId, consumableId, expirationDate)
      .orderBy('r.endedOn')
      .limit(quantityToReconcile)

    // Transfer, if neccesary, the quantityToTransfer from the warehouse to the site and save the InventoryTransfer
    // (with the effectiveDate set with the oldest result.endedOn overrading the time to 00:00:00 and the automaticTransfer set in true)
    if (quantityToTransfer > 0) {
      const minimumDate = missingInventoryToReconcile[0].endedOn
      const effectiveDate = startOfDay(minimumDate)

      const payload = {
        fromSiteId: parentWarehouseId,
        toSiteId: siteId,
        consumableId,
        quantity: quantityToTransfer,
        expiresOn: expirationDate,
        logProps: {
          effectiveDate,
          isAutomatic: true,
        },
      }

      await transferInventory({ payload, plugins, dataConstraints: {}, partnerId, userId: null })
    }

    // Substract each consumable from the site (the InventoryLog should have an effectiveDate = result.endedOn)
    /* eslint-disable no-await-in-loop */
    for (const missingInventory of missingInventoryToReconcile) {
      const { missingInventoryLotId, resultId, assayId, startedOn, endedOn, payload } = missingInventory
      const consumables = get(JSON.parse(payload), 'result.consumable') || []

      await transact(async knex => {
        await consumeInventoryForResult(
          resultId,
          assayId,
          siteId,
          consumables,
          partnerId,
          startedOn,
          endedOn,
          knex,
          plugins.messageContext,
          null
        )
        // Delete missingInventoryLots entry
        await knex('MissingInventoryLots as m').where('id', missingInventoryLotId).delete()
      })
    }
  }
}

module.exports = {
  missingLotsResolver,
}
