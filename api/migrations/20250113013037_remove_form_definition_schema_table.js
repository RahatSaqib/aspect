exports.up = async function (knex) {
  await knex.schema.table('FormDefinition', table => {
    table.string('jsonSchemaFile').nullable()
  })

  await knex('FormDefinition')
    .update('FormDefinition.jsonSchemaFile', knex.raw('fds.jsonSchemaFile'))
    .join(
      knex('FormDefinitionSchema').select('id', 'jsonSchemaFile').as('fds'),
      'FormDefinition.formDefinitionSchemaId',
      'fds.id'
    )

  await knex.schema.table('FormDefinition', function (table) {
    table.dropForeign('formDefinitionSchemaId').dropColumn('formDefinitionSchemaId')
  })

  await knex.schema.alterTable('FormDefinition', assayType => {
    assayType.string('jsonSchemaFile').notNullable().alter()
  })

  await knex.schema.dropTable('FormDefinitionSchema')
}

exports.down = async function (knex) {
  await knex.schema.createTable('FormDefinitionSchema', table => {
    table.increments('id').primary()
    table.string('jsonSchemaFile').notNullable()
  })

  await knex.schema.table('FormDefinition', table => {
    table.integer('formDefinitionSchemaId').unsigned().nullable()
    table.foreign('formDefinitionSchemaId').references('FormDefinitionSchema.id')
  })

  await knex('FormDefinitionSchema').insert(await knex('FormDefinition').select('jsonSchemaFile').distinct())

  await knex('FormDefinition').update({
    formDefinitionSchemaId: knex('FormDefinitionSchema')
      .select('id')
      .whereRaw('FormDefinition.jsonSchemaFile = FormDefinitionSchema.jsonSchemaFile'),
  })

  await knex.schema.table('FormDefinition', table => {
    table.dropColumn('jsonSchemaFile')
  })
}
