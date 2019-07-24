module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Person', t => {
    t.unique('userId')
  })
}
async function down(knex) {
  await knex.schema.alterTable('Person', t => {
    t.dropUnique('userId')
  })
}
