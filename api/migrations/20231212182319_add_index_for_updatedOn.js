exports.up = async function (knex) {
  await knex.schema.alterTable('Result', x => {
    x.dateTime('updatedOn').notNullable().index().defaultTo(knex.fn.now()).alter()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Result', x => {
    x.dropIndex('updatedOn')
  })
}
