module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Result', t => {
    t.dropForeign('partnerId','result_partnerid_index')
  })
  await knex.schema.alterTable('Site', t => {
    t.index(['partnerId', 'geographyId'])
  })
  await knex.schema.alterTable('Result', t => {
    t.dropForeign('partnerId')
    t.integer('partnerId')
      .notNullable()
      .alter()
    t.foreign('partnerId').references('Partner.id')
  })
}
async function down(knex) {
  await knex.schema.table('Result', t => {
    t.dropForeign('partnerId','result_partnerid_index')
  })
  await knex.schema.alterTable('Site', t => {
    t.dropIndex(['partnerId', 'geographyId'])
  })
  await knex.schema.alterTable('Result', t => {
    t.dropForeign('partnerId')
    t.integer('partnerId')
      .nullable()
      .alter()
    t.foreign('partnerId').references('Partner.id')
  })
}
