module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.createTable('DeviceConfiguration', deviceConfiguration => {
    deviceConfiguration.increments('id', { primaryKey: true })
    deviceConfiguration.integer('geographyId').unsigned().notNullable().index().references('id').inTable('Geography')
    deviceConfiguration.json('data')
    deviceConfiguration.integer('deviceTypeId').unsigned().notNullable().index().references('id').inTable('DeviceType')

    deviceConfiguration.integer('partnerId').unsigned().notNullable().index().references('id').inTable('Partner')

    deviceConfiguration.timestamp('createdOn').notNullable().defaultTo(knex.fn.now())

    deviceConfiguration.timestamp('updatedOn')
  })

  await knex.schema.alterTable('Device', device => {
    device.dateTime('connectSettingsSentOn').defaultTo(null)
  })
}

async function down(knex) {
  await knex.schema.dropTableIfExists('DeviceConfiguration')

  await knex.schema.alterTable('Device', device => {
    device.dropColumn('connectSettingsSentOn')
  })
}
