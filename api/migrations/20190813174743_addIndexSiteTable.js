module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', t => {
    t.dropForeign('partnerId')
  })
  await knex.schema.alterTable('DeviceApiKey', t => {
    t.dropForeign('partnerId')
  })
  await knex.schema.alterTable('DeviceApiKey', t => {
    t.integer('partnerId').unsigned().notNullable().references('id').inTable('Partner').alter()
  })
  await knex.schema.alterTable('Result', t => {
    t.integer('partnerId').unsigned().notNullable().references('id').inTable('Partner').alter()
  })
  await knex.schema.alterTable('Site', t => {
    t.index(['partnerId', 'geographyId'])
  })
}

async function down(knex) {
  await knex.schema.alterTable('Result', t => {
    t.dropForeign('partnerId')
  })
  await knex.schema.alterTable('Result', t => {
    t.integer('partnerId').unsigned().nullable().references('id').inTable('Partner').alter()
  })
  await knex.schema.alterTable('DeviceApiKey', t => {
    t.dropForeign('partnerId')
  })
  await knex.schema.alterTable('DeviceApiKey', t => {
    t.integer('partnerId').unsigned().nullable().references('id').inTable('Partner').alter()
  })
  await knex.schema.alterTable('Site', t => {
    t.dropIndex(['partnerId', 'geographyId'])
  })
}
