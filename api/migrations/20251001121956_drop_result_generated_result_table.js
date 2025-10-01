exports.up = async function (knex) {
  await knex.schema.dropTable('ResultGeneratedResult')
}

exports.down = async function (knex) {
  await knex.schema.createTable('ResultGeneratedResult', table => {
    table.integer('sourceResultId').unsigned().index().references('id').inTable('Result')
    table.integer('generatedResultId').unsigned().index().references('id').inTable('Result')
    table.primary(['sourceResultId', 'generatedResultId'])
  })
}
