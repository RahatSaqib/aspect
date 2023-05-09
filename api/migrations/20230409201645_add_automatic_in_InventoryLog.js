/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('InventoryLog', tbl => {
    tbl.boolean('isAutomatic', 255).nullable()
  })

  await knex.schema.createTable('MissingInventoryLots', t => {
    t.increments('id')
    t.integer('resultId').unsigned().notNullable().index().references('id').inTable('Result')
    t.dateTime('expirationDate')
    t.integer('lotNumber').unsigned()
    t.integer('siteId').unsigned().index().references('id').inTable('Site')
    t.dateTime('createdOn').notNullable()
    t.integer('createdBy').unsigned().index().references('id').inTable('User')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('InventoryLog', tbl => {
    tbl.dropColumn('isAutomatic')
  })

  await knex.schema.dropTableIfExists('MissingInventoryLots')
}
