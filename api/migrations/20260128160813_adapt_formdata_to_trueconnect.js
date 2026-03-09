const { addCreateFields, addUpdateFieldsNullable } = require('./utils')

exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('FormData')
  await knex.schema.createTable('FormData', table => {
    table.increments('id')
    table.integer('siteId').unsigned().nullable().index().references('id').inTable('Site')
    table.integer('resultId').unsigned().nullable().index().references('id').inTable('Result')
    table.string('sampleExternalId', 80).nullable()
    table.string('externalId', 36).nullable().index()
    table.json('data').notNullable()
    table.dateTime('collectedOn').nullable()
    addCreateFields(table)
    addUpdateFieldsNullable(table)
    table.unique(['siteId', 'sampleExternalId'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('FormData')
  await knex.schema.createTable('FormData', table => {
    table.increments('id')
    table.integer('resultId').unsigned().nullable().index().references('id').inTable('Result')
    table.integer('caseId').unsigned().nullable().index().references('id').inTable('PatientCase')
    table.json('data').notNullable()
  })
}
