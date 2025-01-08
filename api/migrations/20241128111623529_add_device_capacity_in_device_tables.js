module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', t => {
    t.integer('dailyTestCapacity').unsigned().defaultTo(null)
  })

  await knex('Device').update({
    dailyTestCapacity: knex.raw(`
      COALESCE(
        (
          SELECT dc.dailyCapacity
          FROM DeviceCapacity AS dc
          WHERE Device.deviceCapacityId = dc.id
        ),
        NULL
      )
    `),
    moduleBayCapacity: knex.raw(`
      COALESCE(
        NULLIF(Device.moduleBayCapacity, 0), 
        (
          SELECT dc.modules
          FROM DeviceCapacity AS dc
          WHERE Device.deviceCapacityId = dc.id
        ),
        0
      )
    `),
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', t => {
    t.dropColumn('dailyTestCapacity')
  })
}
