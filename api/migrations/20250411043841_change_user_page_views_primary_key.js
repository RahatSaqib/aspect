exports.up = async function (knex) {
  await knex.schema.alterTable('UserPageViews', table => {
    table.dropColumn('id')
  })

  await knex.schema.alterTable('UserPageViews', table => {
    table.primary(['personId', 'timeframe'])
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('UserPageViews', table => {
    table.dropPrimary()
  })

  await knex.schema.alterTable('UserPageViews', table => {
    table.increments('id').primary()
  })
}
