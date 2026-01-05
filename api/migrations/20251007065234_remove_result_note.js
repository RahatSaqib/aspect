exports.up = async function (knex) {
  // Drop ResultNote first (child), then ResultNoteType (parent)
  await knex.schema.dropTableIfExists('ResultNote')
  await knex.schema.dropTableIfExists('ResultNoteType')
}

exports.down = async function (knex) {
  await knex.schema.createTable('ResultNoteType', resultNoteType => {
    resultNoteType.increments('id')
    resultNoteType.string('name').notNullable()
    resultNoteType.string('i18nKey').notNullable()
    resultNoteType.string('externalId').notNullable()
  })

  await knex.schema.createTable('ResultNote', resultNote => {
    resultNote.increments('id')
    resultNote.integer('resultNoteTypeId').unsigned().references('id').inTable('ResultNoteType').notNullable()
    resultNote.integer('resultId').unsigned().references('id').inTable('Result').notNullable()
    resultNote.string('text').notNullable()
    resultNote.dateTime('changedOn').notNullable()
    resultNote.dateTime('createdOn').notNullable()
    resultNote.integer('createdBy').unsigned().index().references('id').inTable('User')
    resultNote.integer('updatedBy').unsigned().index().references('id').inTable('User')
  })
}
