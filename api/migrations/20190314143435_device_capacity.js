module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('DeviceCapacity', capacity => {
    capacity.increments('id')
    capacity.integer('partnerId').unsigned().index().references('id').inTable('Partner').notNullable()
    capacity.integer('deviceTypeId').unsigned().index().references('id').inTable('DeviceType').notNullable()
    capacity.string('name').notNullable()
    capacity.boolean('defaultForDeviceType').notNullable().defaultTo(0)
    capacity.float('dailyCapacity').notNullable()
  })

  await knex.schema.table('Device', device => {
    device.integer('deviceCapacityId').unsigned().references('id').inTable('DeviceCapacity').after('deviceTypeId')
  })
}

async function down(knex) {
  await knex.schema.table('Device', device => {
    device.dropForeign('deviceCapacityId')
    device.dropColumns('deviceCapacityId')
  })

  await knex.schema.dropTable('DeviceCapacity')
}
