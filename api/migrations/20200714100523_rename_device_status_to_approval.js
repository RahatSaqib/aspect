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
    deviceApprovalLog
      .integer('deviceApprovalId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceApproval')
      .alter()
  })
  await knex.schema.alterTable('Device', device => {
    device
      .integer('deviceApprovalId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceApproval')
      .alter()
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
  })

  await knex.schema.alterTable('DeviceStatusLog', deviceApprovalLog => {
    deviceApprovalLog
      .integer('deviceStatusId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceStatus')
      .alter()
  })
  await knex.schema.alterTable('Device', device => {
    device
      .integer('deviceStatusId')
      .unsigned()
      .index()
      .references('id')
      .inTable('DeviceStatus')
      .alter()
  })
}
