exports.up = async function (knex) {
  await knex.schema.alterTable('State', table => {
    table.integer('createdBy').nullable()
    table.dateTime('createdOn').nullable()
    table.integer('updatedBy').nullable()
    table.dateTime('updatedOn').nullable()
  })
  await knex.schema.alterTable('Lga', table => {
    table.integer('createdBy').nullable()
    table.dateTime('createdOn').nullable()
    table.integer('updatedBy').nullable()
    table.dateTime('updatedOn').nullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('State', x => {
    x.dropColumn('createdBy')
    x.dropColumn('createdOn')
    x.dropColumn('updatedBy')
    x.dropColumn('updatedOn')
  })
  await knex.schema.alterTable('Lga', x => {
    x.dropColumn('createdBy')
    x.dropColumn('createdOn')
    x.dropColumn('updatedBy')
    x.dropColumn('updatedOn')
  })
}
