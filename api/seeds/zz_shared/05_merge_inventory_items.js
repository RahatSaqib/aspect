/* eslint-disable import/no-dynamic-require */

module.exports = require('../utils').seed(seed, __filename)
const Promise = require('bluebird')

async function seed(knex) {
  const inventoryLog = await knex('InventoryItem')
    .max('id as elegibleId')
    .count('id as qty')
    .sum('quantityOnHand as quantityOnHand')
    .select(
      'consumableId',
      'siteId',
      'lotNumber',
      'expiresOn',
      'inTransitFromSiteId'
    )
    .groupBy(
      'consumableId',
      'siteId',
      'lotNumber',
      'expiresOn',
      'inTransitFromSiteId'
    )
    .having('qty', '>', 1)
  const trx = await knex.transaction()
  try {
    await Promise.each(
      inventoryLog,
      async ({
        consumableId,
        siteId,
        lotNumber,
        quantityOnHand,
        expiresOn,
        inTransitFromSiteId,
        elegibleId,
      }) => {
        const toBeDeleted = await knex('InventoryItem')
          .where({
            consumableId,
            siteId,
            lotNumber,
            expiresOn,
            inTransitFromSiteId,
          })
          .where('id', '<>', elegibleId)
          .pluck('id')

        await trx('InventoryLog')
          .whereIn('id', toBeDeleted)
          .update({ inventoryItemId: elegibleId })
        await trx('InventoryItem')
          .where('id', elegibleId)
          .update({ quantityOnHand })
        await trx('InventoryItem').whereIn('id', toBeDeleted).delete()
      }
    )
    await trx.commit()
  } catch (e) {
    await trx.rollback()
    throw e
  }
}
