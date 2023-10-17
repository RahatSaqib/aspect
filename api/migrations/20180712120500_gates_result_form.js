module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.table('Result', result => {
    result.specificType('formData', 'JSON')
  })

  await knex.raw('SET foreign_key_checks = 1')
}

async function down(knex) {
  await knex.raw('SET foreign_key_checks = 0')

  await knex.schema.table('Result', result => {
    result.dropColumn('formData')
  })

  await knex.raw('SET foreign_key_checks = 1')
}
