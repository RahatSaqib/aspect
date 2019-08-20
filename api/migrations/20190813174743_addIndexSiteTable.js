module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', t => {
    t.dropIndex('result_partnerid_index')
    t.integer('partnerId')
      .notNullable()
      .alter()
    t.foreign('partnerId').references('Partner.id')
  })
  await knex.schema.alterTable('Site', t => {
    t.index(['partnerId', 'geographyId'])
  })
}
async function down(knex) {
  await knex.schema.alterTable('Result', t => {
    t.index('result_partnerid_index')

    t.integer('partnerId')
      .nullable()
      .alter()
    t.foreign('partnerId').references('Partner.id')
    t.dropIndex(['partnerId', 'geographyId'])
  })
}
