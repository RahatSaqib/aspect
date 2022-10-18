module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Person', person => {
    person.integer('partnerId').unsigned().index().references('id').inTable('Partner')
  })
}

async function down(knex) {
  await knex.schema.alterTable('Person', person => {
    person.dropForeign('partnerId')
  })
  await knex.schema.alterTable('Person', person => {
    person.dropColumns('partnerId')
  })
}
