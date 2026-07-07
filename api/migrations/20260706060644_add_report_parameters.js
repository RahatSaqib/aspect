module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Report', table => {
    table.json('parameters').nullable()
  })

  await knex('Report').update({ parameters: '[]' })

  await knex.schema.alterTable('Report', table => {
    table.json('parameters').notNullable().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Report', table => {
    table.dropColumn('parameters')
  })
}
