module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Person', tbl => {
    tbl.boolean('disabled').default(0)
    tbl.dateTime('disabledOn').nullable()
    tbl.integer('disabledBy').nullable()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Person', tbl => {
    tbl.dropColumn('disabled')
    tbl.dropColumn('disabledOn')
    tbl.dropColumn('disabledBy')
  })
}
