exports.up = async function (knex) {
  await knex.schema.alterTable('FactCustomFieldCompletion', table => {
    table.unique(['siteId', 'assayId', 'date'])
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('FactCustomFieldCompletion', table => {
    table.dropUnique(['siteId', 'assayId', 'date'])
  })
}
