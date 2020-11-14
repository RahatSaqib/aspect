module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('WebhookTemplate', tbl => {
    tbl.text('okResponseSuccessRegex')
  })
}

async function down(knex) {
  await knex.schema.table('WebhookTemplate', tbl => {
    tbl.dropColumn('okResponseSuccessRegex')
  })
}
