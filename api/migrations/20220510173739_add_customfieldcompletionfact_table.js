const tableName = 'FactCustomFieldCompletion'

module.exports.up = async function (knex) {
  await knex.schema.createTable(tableName, x => {
    x.increments('id').primary()
    x.integer('siteId').unsigned().index().references('id').inTable('Site').notNullable()
    x.integer('assayId').unsigned().index().references('id').inTable('Assay').notNullable()
    x.dateTime('date').index().notNullable()
    x.decimal('completionRate', 5, 2).notNullable()
    x.json('completionByField').notNullable()
    x.integer('recordCount').notNullable()
    x.dateTime('updatedOn').notNullable()
  })
}

module.exports.down = async function (knex) {
  await knex.schema.dropTable(tableName)
}
