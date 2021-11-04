module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex('Partner').update({
    dueDaysInventoryStockout: 30,
    dueDaysInventoryStockExpiring: 30,
  })

  await knex.schema.alterTable('Partner', tbl => {
    tbl.integer('dueDaysInventoryStockout').notNullable().default(30).alter()
    tbl
      .integer('dueDaysInventoryStockExpiring')
      .notNullable()
      .default(30)
      .alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('Partner', tbl => {
    tbl.integer('dueDaysInventoryStockout').unsigned().nullable().alter()
    tbl.integer('dueDaysInventoryStockExpiring').unsigned().nullable().alter()
  })
}
