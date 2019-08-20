module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', t => {
    t.integer('partnerId')
      .unsigned()
      .notNullable()
      // .references('Partner.id')
      .alter()
  })
  await knex.schema.alterTable('Site', t => {
    t.index(['partnerId', 'geographyId'])
  })
}
async function down(knex) {
  await knex.schema.alterTable('Result', t => {
    t.integer('partnerId')
      .unsigned()
      .nullable()
      .alter()
  })
  await knex.schema.alterTable('Site', t => {
    t.dropIndex(['partnerId', 'geographyId'])
  })
}
