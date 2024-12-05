module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', t => {
    t.integer('dailyTestCapacity').unsigned().defaultTo(null)
  })
  const getDeviceCapacityUpdateQuery = (column, field, defaultValue) =>
    knex.raw(`
    COALESCE(
      (
        SELECT dc.${field}
        FROM DeviceCapacity AS dc
        WHERE Device.deviceCapacityId = dc.id
      ),
      ${defaultValue}
    )
  `)

  await knex('Device').update({
    dailyTestCapacity: getDeviceCapacityUpdateQuery('dailyCapacity', 'dailyCapacity', 'NULL'),
    moduleBayCapacity: getDeviceCapacityUpdateQuery('modules', 'modules', 0),
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', t => {
    t.dropColumn('dailyTestCapacity')
  })
}
