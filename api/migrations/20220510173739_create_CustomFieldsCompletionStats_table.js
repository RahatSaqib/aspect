const { addAuditFields } = require('./utils')

const tableName = 'CustomFieldsCompletionStats'

module.exports.up = async function (knex) {
  await knex.schema.createTable(tableName, cs => {
    cs.increments('id').primary()
    cs.integer('siteId')
      .unsigned()
      .index()
      .references('id')
      .inTable('Site')
      .notNullable()
    cs.dateTime('date').index().notNullable()
    cs.decimal('completionRate', 5, 2).notNullable()
    cs.json('completionByField').notNullable()
    cs.integer('recordCount').notNullable()
    addAuditFields(cs)
  })
}

module.exports.down = async function (knex) {
  await knex.schema.dropTable(tableName)
}
