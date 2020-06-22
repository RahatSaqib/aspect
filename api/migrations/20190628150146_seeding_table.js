module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('AspectSeed', seeds => {
    seeds.increments('id').primary()
    seeds.string('fileName').notNullable()
    seeds.datetime('runOn').notNullable().defaultTo(knex.fn.now())
    seeds.boolean('success').notNullable()
    seeds.text('errorMessage').nullable()
  })
}

async function down(knex) {
  await knex.schema.dropTable('AspectSeed')
}
