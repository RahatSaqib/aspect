module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.table('Issue', issue => {
    issue
      .integer('consumableId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Consumable')
  })
}

async function down(knex) {
  await knex.schema.table('Issue', issue => {
    issue.dropColumns('Consumable')
  })
}
