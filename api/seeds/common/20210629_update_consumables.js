const { upsertItems } = require('../utils')
const getConsumables = require('../fixtures/Consumable')

module.exports = async (knex) => {
  const fixture = await getConsumables()
  // allowInserts = false --> prevent inserting unused consumables for specific countries
  // upsertItems for syncing only existing consumables
  await upsertItems(knex, 'Consumable', 'externalId', fixture, true)
}
