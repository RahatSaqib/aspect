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
    await Promise.each(consumables, cons => {
      const consumableInDb = _.find(
        consumableFixtures,
        elem => elem.name === cons.name
      )
      return knex('Consumable')
        .update({
          externalId: consumableInDb.externalId,
        })
        .where({
          id: cons.id,
        })
    })

  await knex.schema.alterTable('Consumable', tbl => {
    tbl.string('externalId').notNullable().unique().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Consumable', tbl => {
    /**
     * first drop FK and index, and then
     * repeat same settings as in `api/migrations/20190304072614_device_maintenance.js`
     */

    tbl.dropColumn('externalId')
  })
}
