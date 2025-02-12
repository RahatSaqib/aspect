module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Partner', t => {
    t.json('customWorkingDays').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', t => {
    t.dropColumn('customWorkingDays')
  })
}
