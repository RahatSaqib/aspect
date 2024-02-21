exports.up = async function (knex) {
  await knex.schema.alterTable('Report', table => {
    table.json('validations').nullable()
  })

  await knex('Report').update({ validations: '[]' })

  await knex.schema.alterTable('Report', table => {
    table.json('validations').notNullable().alter()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('Report', table => {
    table.dropColumn('validations')
  })
}
