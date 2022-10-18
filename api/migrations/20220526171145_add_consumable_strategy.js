const tableName = 'Consumable'

module.exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, x => {
    x.string('strategy').notNullable().default('withLotAndExpirationDateStrategy')
  })
}

module.exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, x => x.dropColumn('strategy'))
}
