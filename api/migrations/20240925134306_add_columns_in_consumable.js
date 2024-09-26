module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Consumable', t => {
    t.boolean('includeLocation').nullable()
    t.string('partNumber').nullable()
    t.integer('price').unsigned().nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Consumable', t => {
    t.dropColumn('includeLocation')
    t.dropColumn('partNumber')
    t.dropColumn('price')
  })
}
