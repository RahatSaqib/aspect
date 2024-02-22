exports.up = async function (knex) {
  await knex.schema.createTable('FactDeviceModulesCount', table => {
    table.integer('deviceId').unsigned().notNullable().references('id').inTable('Device')
    table.date('date').notNullable().index()
    table.integer('moduleBaysUsed').notNullable()
    table.integer('modulesUsed').notNullable()
    table.primary(['deviceId', 'date'])
  })
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('FactDeviceModulesCount')
}
