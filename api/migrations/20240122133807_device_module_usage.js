exports.up = async function (knex) {
    await knex.schema.createTable('FactDeviceModulesCount', table => {
        table.integer('deviceId').nullable(false)
        table.date('date').notNullable().index()
        table.integer('moduleBaysUsed').nullable(false)
        table.integer('modulesUsed').nullable(false)
        table.primary(['deviceId', 'date']);
    })
}

exports.down = async function (knex) {
    await knex.schema.dropTableIfExists('FactDeviceModulesCount')
}
