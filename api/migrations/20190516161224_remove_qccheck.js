module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Result', t => {
    t.dropColumn('qcCheck')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Result', t => {
    t
      .boolean('qcCheck')
      .notNullable()
      .defaultTo(0)
  })
}
