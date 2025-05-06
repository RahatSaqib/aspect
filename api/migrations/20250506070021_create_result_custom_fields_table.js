/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable('ResultCustomField', table => {
    table.integer('resultId').unsigned().notNullable().index().references('id').inTable('Result')
    table.integer('formDefinitionId').unsigned().notNullable().index().references('id').inTable('FormDefinition')
    table.specificType('customFieldsData', 'JSON')
    table.dateTime('createdOn').notNullable().defaultTo(knex.fn.now())
    table.dateTime('updatedOn').notNullable().defaultTo(knex.fn.now())

    // Primary key
    table.primary(['resultId', 'formDefinitionId'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable('ResultCustomField')
}
