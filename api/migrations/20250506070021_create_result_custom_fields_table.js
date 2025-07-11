/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('ResultCustomField', table => {
    table.increments('id').primary()
    table.integer('resultId').unsigned().notNullable().index().references('id').inTable('Result')
    table.string('formDefinitionExternalId').notNullable().index()
    table.specificType('customFieldsData', 'JSON')
    table.dateTime('createdOn').notNullable().defaultTo(knex.fn.now())
    table.dateTime('updatedOn').notNullable().defaultTo(knex.fn.now())

    table.unique(['resultId', 'formDefinitionExternalId'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('ResultCustomField')
}
