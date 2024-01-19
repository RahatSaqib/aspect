exports.up = async function (knex) {
    await knex.schema.alterTable('Device', function (table) {
        table.integer('moduleBayCapacity').defaultTo(0)
    })

    await knex.raw(`
        UPDATE Device d 
        JOIN DeviceCapacity c ON (d.deviceCapacityId = c.id)
        SET d.moduleBayCapacity = c.modules
        WHERE c.id IS NOT NULL;
    `)
}

exports.down = async function (knex) {
    await knex.schema.alterTable('Device', function (table) {
        table.dropColumn('moduleBayCapacity')
    })
}
