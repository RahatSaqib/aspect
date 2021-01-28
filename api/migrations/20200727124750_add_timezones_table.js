module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  /* Adding TZ table just for querying purpose */
  await knex.schema.createTable('TimeZone', timezone => {
    timezone.string('id', 100).notNullable()
    timezone.string('name', 100).notNullable()
    timezone.string('timeZone', 100).notNullable()
    timezone.primary('id')
    timezone.charset('utf8')
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('TimeZone')
}
