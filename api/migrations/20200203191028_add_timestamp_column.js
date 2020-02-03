module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.alterTable('ResultStatusLog', x => {
    x.bigInteger('timestamp')
      .unsigned()
      .index()
  })

  await knex.raw('SET foreign_key_checks = 1')
}

async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.alterTable('ResultStatusLog', x => {
    x.dropColumns('timestamp')
  })

  await knex.raw('SET foreign_key_checks = 1')
}
