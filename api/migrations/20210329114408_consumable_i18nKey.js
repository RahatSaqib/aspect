module.exports = require('../src/db').migration(up, down)

const Promise = require('bluebird')
const map = require('lodash/map')
const camelCase = require('lodash/camelCase')

async function up(knex) {
  await knex.schema.table('Consumable', tblConsumable => {
    tblConsumable.text('i18nKey')
  })

  const consumables = await knex('Consumable')
  await Promise.all(
    map(consumables, async ({ externalId }) =>
      knex('Consumable')
        .where({ externalId })
        .update({ i18nKey: camelCase(externalId) })
    )
  )

  await knex.schema.alterTable('Consumable', tblConsumable => {
    tblConsumable.text('i18nKey').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.table('Consumable', tblConsumable => {
    tblConsumable.dropColumn('i18nKey')
  })
}
