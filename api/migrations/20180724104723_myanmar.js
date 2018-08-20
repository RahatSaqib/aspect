const Promise = require('bluebird')

module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Issue', issue => {
    issue
      .integer('consumableId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Consumable')
  })

  await knex.schema.createTable('PartnerConsumable', partnerConsumable => {
    partnerConsumable
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
      .notNullable()
    partnerConsumable
      .integer('consumableId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Consumable')
      .notNullable()
    partnerConsumable
      .boolean('autoInclude')
      .notNullable()
      .defaultTo(0)
    partnerConsumable
      .boolean('allowStockUpdateFromActionDashboard')
      .notNullable()
      .defaultTo(0)
    partnerConsumable.unique(['partnerId', 'consumableId'])
  })

  const partnerConsumables = await knex('Consumable as c')
    .whereNotNull('c.partnerId')
    .select('c.partnerId', 'c.id as consumableId')

  if (partnerConsumables.length > 0) {
    await knex('PartnerConsumable').insert(partnerConsumables)
  }

  await knex.schema.table('Consumable', consumable => {
    consumable.dropForeign('partnerId')
    consumable.dropColumns('partnerId', 'autoInclude')
  })

  await knex.schema.table('AlertTemplate', alertTemplate => {
    alertTemplate
      .boolean('hideWhenSiteFilterIsSelected')
      .notNullable()
      .defaultTo(0)
    alertTemplate
      .boolean('hideWhenSiteFilterIsNotSelected')
      .notNullable()
      .defaultTo(0)
  })
}

async function down(knex) {
  await knex.schema.table('Issue', issue => {
    issue.dropColumns('consumableId')
  })

  await knex.schema.table('Consumable', consumable => {
    consumable
      .integer('partnerId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Partner')
    consumable
      .boolean('autoInclude')
      .notNullable()
      .defaultTo(0)
  })

  const partnerConsumables = await knex('PartnerConsumable as pc').select(
    'pc.partnerId',
    'pc.consumableId',
    'pc.autoInclude'
  )

  await Promise.each(partnerConsumables, partnerConsumable =>
    knex('Consumable')
      .where('id', partnerConsumable.consumableId)
      .update({
        partnerId: partnerConsumable.partnerId,
        autoInclude: partnerConsumable.autoInclude,
      })
  )

  await knex.schema.dropTableIfExists('PartnerConsumable')

  await knex.schema.table('AlertTemplate', alertTemplate => {
    alertTemplate.dropColumns(
      'hideWhenSiteFilterIsSelected',
      'hideWhenSiteFilterIsNotSelected'
    )
  })
}
