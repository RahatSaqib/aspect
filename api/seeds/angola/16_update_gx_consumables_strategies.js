const upsertConsumables = require('../common/upsert_consumables')
const partnerData = require('./fixtures/partnerData')

const cleanUpInventory = async knex => {
  await knex('InventoryLog').del()
  await knex('InventoryItem').del()
}

const seed = async knex => {
  await upsertConsumables(knex, true, [], partnerData.consumableStrategies)
  await cleanUpInventory(knex)
}

module.exports = require('../utils').seed(seed, __filename)
