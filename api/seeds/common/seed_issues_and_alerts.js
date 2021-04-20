const _ = require('lodash')
const { rowsAsObject } = require('../utils')

module.exports = async function seedIssuesAndAlerts(knex, partnerId) {
  const now = new Date()
  // Fill Issue/AlertMessage/Notification table with some mock data
  const devices = await knex('Device').where({ partnerId })

  const issueStatuses = await knex('IssueStatus').select('id').pluck('id')
  const messageStatusSentId = await getId(knex, 'MessageStatus', 'Sent')

  const issue = {
    level: 1,
    partnerId,
    createdOn: now,
    updatedOn: now,
  }
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')

  const issueIds = []
  const luIssueTypeIds = [
    issueTypes.DeviceOffline.id,
    issueTypes.DeviceNoResults.id,
    issueTypes.ModuleFailureError.id,
    issueTypes.ModuleTemperatureError.id,
    issueTypes.ModulePowerError.id,
    issueTypes.MachineTemperatureError.id,
    issueTypes.MachinePowerError.id,
    issueTypes.ModuleProceduralError.id,
    issueTypes.MachineProceduralError.id,
    issueTypes.StockLevelUpdate.id,
    issueTypes.ReagentHealthError.id,
    issueTypes.DeviceOffline.id,
    issueTypes.DeviceNoResults.id,
    issueTypes.ModuleProceduralError.id,
    issueTypes.MachineProceduralError.id,
    issueTypes.StockLevelUpdate.id,
    issueTypes.ReagentHealthError.id,
  ]

  const luAlertMessages = {
    [issueTypes.DeviceOffline.id]: 'Cannot reach network for 12 days',
    [issueTypes.DeviceNoResults.id]: 'No testing for 9 days',
    [issueTypes.ModuleFailureError.id]:
      'Module A1: Critical errors; notify R.O.',
    [issueTypes.ModuleTemperatureError.id]:
      'Temperature errors on Module A2; notify R.O.',
    [issueTypes.ModulePowerError.id]: 'Power errors on Module A3; notify RO',
    [issueTypes.MachineTemperatureError.id]:
      'Temperature errors across machine, conduct troubleshooting',
    [issueTypes.MachinePowerError.id]:
      'Power errors across machine, conduct troubleshooting',
    [issueTypes.ModuleProceduralError.id]:
      'Module A2 errors, conduct troubleshooting',
    [issueTypes.MachineProceduralError.id]:
      'Procedural errors across machine, conduct troubleshooting',

    [issueTypes.StockLevelUpdate.id]: 'Stock Level',
    [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
    [issueTypes.DeviceOffline.id]:
      'No contact for 12 days. If there is a reason for being inactive, add the reason',
    [issueTypes.DeviceNoResults.id]: 'No testing for 9 days',
    [issueTypes.ModuleProceduralError.id]:
      'Module Temperature Issue for 2 days',
    [issueTypes.MachineProceduralError.id]: 'Machine Power Issue for 7 days',
    [issueTypes.StockLevelUpdate.id]: 'Stock Level',

    [issueTypes.ReagentHealthError.id]: 'Cartridge-specific errors exceed 5%',
  }

  const deviceIds = await knex('Device as d')
    .join('JobContext as jc', 'jc.siteId', 'd.siteId')
    .join('Job as j', 'jc.jobId', 'j.id')
    .select('j.personId', 'd.id as deviceId')
    .where({ 'd.partnerId': partnerId })
    .orderBy('deviceId')
    .then(items =>
      items.reduce((memo, row) => {
        if (!memo[row.deviceId]) {
          memo[row.deviceId] = {}
        }
        memo[row.deviceId][row.personId] = row.deviceId
        return memo
      }, {})
    )

  await Promise.all(
    _.map(_.sampleSize(devices, _.random(devices.length)), async device => {
      await Promise.all(
        _.map(luIssueTypeIds, async issueTypeId => {
          const issueStatusId = _.sample(issueStatuses)

          const [issueId] = await knex('Issue').insert({
            issueTypeId,
            issueStatusId,
            deviceId:
              issueTypes.StockLevelUpdate.id === issueTypeId ? null : device.id,
            siteId: device.siteId,
            geographyId: device.geographyId,
            ...issue,
          })
          await knex('IssueStatusLog').insert({
            issueId,
            issueStatusId: _.sample(issueStatuses),
            changedOn: now,
            createdOn: now,
            createdBy: 1,
          })

          issueIds.push(issueId)
        })
      )
    })
  )

  const policies = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', 'i.issueTypeId', 'nt.issueTypeId')
    .join('Job as j', 'j.jobFunctionId', 'nt.jobFunctionId')
    .join('JobContext as jc', 'jc.jobId', 'j.id')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({ 'nt.partnerId': partnerId })
    .whereIn('i.id', issueIds)
    .where('nt.level', 1)
    .select(
      'nt.id as notificationTypeId',
      'nt.jobFunctionId',
      'j.personId',
      'i.id as issueId',
      'i.issueTypeId',
      'i.siteId',
      'i.deviceId',
      'i.resultId',
      'mt.alertTemplateId'
    )

  await Promise.all(
    _.map(policies, async policy => {
      const deviceId = _.get(deviceIds, ['policy.deviceId', 'policy.personId'])
      if (deviceId) {
        const [alertMessageId] = await knex('AlertMessage').insert({
          messageStatusId: messageStatusSentId,
          message: luAlertMessages[policy.issueTypeId],
          createdOn: now,
          updatedOn: now,
          ..._.pick(policy, [
            'alertTemplateId',
            'personId',
            'siteId',
            'deviceId',
            'resultId',
          ]),
        })

        await knex('Notification').insert({
          createdOn: now,
          alertMessageId,
          ..._.pick(policy, ['notificationTypeId', 'issueId', 'personId']),
        })
      }
    })
  )
}
async function getId(knex, table, externalId) {
  const { id } = await knex(table).where({ externalId }).first('id')
  return id
}
