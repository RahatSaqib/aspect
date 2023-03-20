async function up(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.integer('hoursNotificationsShouldWaitForCustomFields').default(4)
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.dropColumn('hoursNotificationsShouldWaitForCustomFields')
  })
}
module.exports = require('../src/db').migration(up, down)
