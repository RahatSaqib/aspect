module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('AspectSeed', seeds => {
    seeds.increments('id').primary()
    seeds.string('fileName').notNullable()
    seeds
      .datetime('runOn')
      .notNullable()
      .defaultTo(knex.fn.now(6))
    seeds.boolean('success').notNullable()
    seeds.string('errorMessage').nullable()
  })
}
async function down(knex) {
  await knex.schema.dropTable('AspectSeed')
}
