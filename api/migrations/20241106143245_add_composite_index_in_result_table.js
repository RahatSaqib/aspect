exports.up = async function (knex) {
  await knex.schema.alterTable('Result', table => {
    table.index(['endedOn', 'updatedOn'], 'composite_index_ended_on_updated_on')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Result', table => {
    table.dropIndex(['endedOn', 'updatedOn'], 'composite_index_ended_on_updated_on')
  })
}
