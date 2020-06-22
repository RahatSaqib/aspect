module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', result => {
    result.date('firstViewedOn').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Result', result => {
    result.dropColumns('firstViewedOn')
  })
}
