module.exports = require('../src/db').migration(up, down)

async function up(knex) {
  await knex.schema.alterTable('DeviceStatusLog', deviceStatusLog => {
    deviceStatusLog.dropForeign('deviceStatusId')
    deviceStatusLog.dropIndex('deviceStatusId')
  })
  await knex.schema.alterTable('Device', device => {
    device.dropForeign('deviceStatusId')
    device.dropIndex('deviceStatusId')
  })

  await knex.schema.renameTable('DeviceStatus', 'DeviceApproval')
  await knex.schema.renameTable('DeviceStatusLog', 'DeviceApprovalLog')

  await knex.schema.alterTable('DeviceApprovalLog', deviceStatusLog => {
    deviceStatusLog.renameColumn('deviceStatusId', 'deviceApprovalId')
  })
  await knex.schema.alterTable('Device', device => {
    device.renameColumn('deviceStatusId', 'deviceApprovalId')
  })

  await knex.schema.alterTable('DeviceApprovalLog', deviceApprovalLog => {
    deviceApprovalLog.integer('deviceApprovalId').unsigned().index().references('id').inTable('DeviceApproval').alter()
  })

  await knex.schema.createTable('DeviceMaintenanceStatus', maintenanceStatus => {
    maintenanceStatus.increments('id')
    maintenanceStatus.string('name').notNullable()
    maintenanceStatus.string('i18nKey').notNullable()
    maintenanceStatus.string('externalId').unique().notNullable()
    maintenanceStatus.boolean('active').notNullable()
    maintenanceStatus.boolean('manuallySet').notNullable()
  })

  await knex.schema.createTable('DeviceMaintenanceStatusLog', maintenanceStatusLog => {
    maintenanceStatusLog.increments('id')
    maintenanceStatusLog.integer('deviceId').unsigned().index().references('id').inTable('Device').onDelete('CASCADE')
    maintenanceStatusLog
      .integer('deviceMaintenanceStatusId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceMaintenanceStatus')
      .notNullable()
    maintenanceStatusLog.specificType('data', 'JSON').notNullable()
    maintenanceStatusLog.date('day').index().notNullable()
    maintenanceStatusLog.dateTime('createdOn').index().notNullable()
    maintenanceStatusLog.integer('createdBy').unsigned().index().references('id').inTable('User').onDelete('SET NULL')
  })

  await knex.schema.alterTable('Device', device => {
    device.integer('deviceApprovalId').unsigned().index().references('id').inTable('DeviceApproval').alter()
    device
      .integer('deviceMaintenanceStatusLogId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceMaintenanceStatusLog')
      .onDelete('SET NULL')
  })
}

async function down(knex) {
  await knex.schema.alterTable('DeviceApprovalLog', deviceStatusLog => {
    deviceStatusLog.dropForeign('deviceApprovalId')
    deviceStatusLog.dropIndex('deviceApprovalId')
  })
  await knex.schema.alterTable('Device', device => {
    device.dropForeign('deviceApprovalId')
    device.dropIndex('deviceApprovalId')
  })

  await knex.schema.renameTable('DeviceApproval', 'DeviceStatus')
  await knex.schema.renameTable('DeviceApprovalLog', 'DeviceStatusLog')

  await knex.schema.alterTable('DeviceStatusLog', deviceStatusLog => {
    deviceStatusLog.renameColumn('deviceApprovalId', 'deviceStatusId')
  })
  await knex.schema.alterTable('Device', device => {
    device.renameColumn('deviceApprovalId', 'deviceStatusId')
    device.dropForeign('deviceMaintenanceStatusLogId')
    device.dropIndex('deviceMaintenanceStatusLogId')
    device.dropColumns('deviceMaintenanceStatusLogId')
  })

  await knex.schema.alterTable('DeviceStatusLog', deviceApprovalLog => {
    deviceApprovalLog.integer('deviceStatusId').unsigned().index().references('id').inTable('DeviceStatus').alter()
  })
  await knex.schema.alterTable('Device', device => {
    device.integer('deviceStatusId').unsigned().index().references('id').inTable('DeviceStatus').alter()
  })

  await knex.schema.dropTableIfExists('DeviceMaintenanceStatusLog')
  await knex.schema.dropTableIfExists('DeviceMaintenanceStatus')
}
