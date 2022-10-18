const Promise = require('bluebird')
const _ = require('lodash')
const getConsumables = require('../seeds/fixtures/Consumable')
module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Consumable', tbl => {
    tbl.string('externalId', 100).defaultTo('')
  })
  const consumableFixtures = await getConsumables()
  const consumables = await knex('Consumable').select()

  if (consumables.length > 0)
    await Promise.each(consumables, ({ name: consumableName, id }) => {
      const consumableInDb = _.find(consumableFixtures, ({ name }) => name === consumableName)
      return knex('Consumable')
        .update({
          externalId: consumableInDb.externalId,
        })
        .where({
          id,
        })
    })

  await knex.schema.alterTable('Consumable', tbl => {
    tbl.string('externalId').notNullable().unique().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Consumable', tbl => {
    tbl.dropColumn('externalId')
  })
}
