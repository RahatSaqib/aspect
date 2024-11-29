module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', t => {
    t.integer('dailyTestCapacity').unsigned().notNullable().defaultTo(0)
  })
  await knex('Device').update({
    dailyTestCapacity: knex.raw(`
      COALESCE(
        (SELECT dc.dailyCapacity 
         FROM DeviceCapacity AS dc 
         WHERE Device.deviceCapacityId = dc.id),
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
