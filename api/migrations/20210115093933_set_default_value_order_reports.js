module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Report', tblReport => {
    tblReport.integer('sortOrder').defaultTo(0).notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Report', tblReport => {
    tblReport.integer('sortOrder').notNullable().alter()
  })
}
