exports.up = async function (knex) {
  await knex.schema.alterTable('Sample', table => {
    table.integer('updatedBy').unsigned().index().references('id').inTable('User').alter()

    table.integer('collectedBy').unsigned().index().references('id').inTable('User').alter()

    table.bool('registeredInAspect').notNullable().default(false)
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Sample', table => {
    table.dropForeign('updatedBy')
    table.dropIndex('updatedBy')

    table.dropForeign('collectedBy')
    table.dropIndex('collectedBy')

    table.dropColumn('registeredInAspect')
  })
}
