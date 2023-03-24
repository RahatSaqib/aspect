async function up(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.integer('daysLimitToNotifyResults').default(30)
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.dropColumn('daysLimitToNotifyResults')
  })
}
module.exports = require('../src/db').migration(up, down)
