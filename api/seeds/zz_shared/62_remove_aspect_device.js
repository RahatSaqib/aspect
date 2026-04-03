module.exports = require('../utils').seed(async knex => {
  const aspectDeviceType = await knex('DeviceType').where({ externalId: 'Aspect' }).first()
  if (aspectDeviceType) {
    const aspectDeviceTypeId = aspectDeviceType.id
    const aspectDeviceIds = await knex('Device').where({ deviceTypeId: aspectDeviceTypeId }).pluck('id')
    const opIds = await knex('DeviceOperation').whereIn('deviceId', aspectDeviceIds).pluck('id')
    await knex('DeviceApprovalLog').whereIn('deviceId', aspectDeviceIds).delete()
    await knex('DeviceApiKey').whereIn('deviceId', aspectDeviceIds).delete()
    await knex('Device').whereIn('id', aspectDeviceIds).update({ deviceMaintenanceStatusLogId: null })
    await knex('DeviceMaintenanceStatusLog').whereIn('deviceId', aspectDeviceIds).delete()
    await knex('DeviceLog').whereIn('deviceId', aspectDeviceIds).delete()
    await knex('DeviceOperation').whereIn('id', opIds).delete()
    await knex('FactDeviceFlag').whereIn('deviceId', aspectDeviceIds).delete()
    await knex('FactResultsDevice').whereIn('deviceId', aspectDeviceIds).delete()
    await knex('FactResultsDeviceByAssay').whereIn('deviceId', aspectDeviceIds).delete()
    await knex('FactResultsDeviceByCategory1').whereIn('deviceId', aspectDeviceIds).delete()

    const issueIds = await knex('Issue').whereIn('deviceId', aspectDeviceIds).pluck('id')
    await knex('IssueEvent').whereIn('issueId', issueIds).delete()
    await knex('Issue').whereIn('id', issueIds).delete()

    await knex('Device').whereIn('id', aspectDeviceIds).delete()

    await knex('JobContext').where('deviceTypeId', aspectDeviceTypeId).delete()
    await knex('DeviceConfiguration').where('deviceTypeId', aspectDeviceTypeId).delete()
    await knex('DeviceType').where({ id: aspectDeviceTypeId }).delete()
  }
}, __filename)
