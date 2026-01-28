const { addCreateFields, addUpdateFieldsNullable } = require('./utils')

exports.up = async function (knex) {
  await knex.schema.alterTable('FormData', table => {
    table.dropForeign('caseId')
    table.dropIndex('caseId')
    table.dropColumn('caseId')

    addCreateFields(table)
    addUpdateFieldsNullable(table)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('FormData', table => {
    table.dropForeign('createdBy')
    table.dropIndex('createdBy')
    table.dropForeign('updatedBy')
    table.dropIndex('updatedBy')
    table.dropColumn('createdOn')
    table.dropColumn('createdBy')
    table.dropColumn('updatedOn')
    table.dropColumn('updatedBy')

    table.integer('caseId').unsigned().nullable().index().references('id').inTable('PatientCase')
  })
}
