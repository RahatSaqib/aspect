module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('Device', t => {
    t.integer('dailyTestCapacity').nullable()
  })
  await knex('Device').update({
    dailyTestCapacity: knex
      .select('dc.dailyCapacity')
      .from('DeviceCapacity as dc')
      .where('Device.deviceCapacityId', '=', knex.raw('dc.id')),
  })
}

async function down(knex) {
  await knex.schema.alterTable('Device', t => {
    t.dropColumn('dailyTestCapacity')
  })
}
