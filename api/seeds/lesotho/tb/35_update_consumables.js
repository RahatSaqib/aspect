module.exports = require('../../utils').seed(seed, __filename)

const { upsertItems } = require('../../utils')
const getConsumables = require('../../fixtures/Consumable')

async function seed(knex) {
  const fixture = await getConsumables()
  await upsertItems(knex, 'Consumable', 'externalId', fixture, false)
}
