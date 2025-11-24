exports.up = async function (knex) {
  await knex.schema.table('Result', table => {
    table.dateTime('reconciliationDate')
  })
  await knex('Result as r')
    .leftJoin('MissingInventoryLots as mil', 'mil.resultId', 'r.id')
    .whereNull('mil.id')
    .update('reconciliationDate', knex.ref('startedOn'))
  await knex.schema.dropTable('MissingInventoryLots')
}

exports.down = async function (knex) {
  await knex.schema.table('Result', table => {
    table.dropColumn('reconciliationDate')
  })
  await knex.schema.createTable('MissingInventoryLots', table => {
    table.increments('id')
    table.integer('resultId').unsigned().notNullable().index().references('id').inTable('Result')
    table.dateTime('expirationDate')
    table.integer('lotNumber').unsigned()
    table.integer('siteId').unsigned().index().references('id').inTable('Site')
    table.integer('consumableId').unsigned().notNullable().references('id').inTable('Consumable')
    table.dateTime('createdOn').notNullable()
    table.integer('createdBy').unsigned().index().references('id').inTable('User')
  })
}
