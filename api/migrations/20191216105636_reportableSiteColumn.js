module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', x => {
    x.dropForeign('siteId')
    x.integer('siteId').unsigned().references('id').inTable('Site').nullable().onDelete('SET NULL').alter()
  })
  await knex.schema.alterTable('Result', result => {
    result.integer('reportableSiteId').unsigned().nullable()
  })
  await knex('Result')
    .update({
      reportableSiteId: knex('Sample')
        .select('originSiteId')
        .where('id', knex.raw('??', ['Result.sampleId'])),
    })
    .whereNull('reportableSiteId')
  await knex.schema.alterTable('Result', result => {
    result.integer('reportableSiteId').unsigned().notNullable().index().references('id').inTable('Site').alter()
  })
}

async function down(knex) {
  await knex.schema.table('Result', result => {
    result.dropForeign('reportableSiteId')
    result.dropColumns('reportableSiteId')
  })
  await knex.schema.table('Device', device => {
    device.dropForeign('siteId')
  })
  await knex.schema.alterTable('Device', device => {
    device.integer('siteId').notNullable().unsigned().references('id').inTable('Site').onDelete('CASCADE').alter()
  })
}
