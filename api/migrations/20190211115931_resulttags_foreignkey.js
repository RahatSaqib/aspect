module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('ResultTag', table => {
    table.dropForeign('resultId')
    table.integer('resultId').unsigned().references('id').inTable('Result').onDelete('CASCADE').alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('ResultTag', table => {
    table.dropForeign('resultId')
    table.integer('resultId').unsigned().references('id').inTable('Result').alter()
  })
}
