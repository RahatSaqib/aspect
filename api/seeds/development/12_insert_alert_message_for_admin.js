const { rowsAsObject } = require('../utils')
const { messageStatusToId } = require('../../src/shared/dictionary')

const { subDays, subMonths } = require('date-fns')
const _ = require('lodash')
const Promise = require('bluebird')

const millisInHour = 1000 * 60 * 60
const now = new Date()

module.exports = require('../utils').seed(seed)

async function seed(knex) {
  const { userId, personId } = await knex('User as u')
    .join('Person as p', 'u.id', 'p.userId')
    .where('u.name', 'Admin')
    .first('u.id as userId', 'p.Id as personId')
  const auditFields = {
    createdOn: subMonths(now, 1),
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  }
  const deviceTypes = await knex('DeviceType').select()
  const { deviceStatusId } = await knex('DeviceStatus')
    .where('token', 'approved')
    .first('id as deviceStatusId')
  const sites = await knex('Site as s')
    .join('Geography as g', 's.geographyid', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('c.a3', 'USA')
    .orderBy('s.updatedOn')
    .select('s.*')
  await Promise.each(new Array(4), async () => {
    const site = _.sample(sites)
    await knex('Device').insert(
      Object.assign(
        {
          partnerId: site.partnerId,
          geographyId: site.geographyId,
          siteId: site.id,
          deviceTypeId: _.sample(deviceTypes).id,
          deviceStatusId,
          name: `Device -${_.random(100000, 999999)}`,
          shortName: `R-${_.random(100000, 999999)}`,
          serial: `S1-R-${_.random(100000, 999999)}`,
          lastSeenOn: subDays(now, _.random(1, 30)),
          lastPingOn: subDays(now, _.random(1, 30)),
          lastPingFromIp: '41.70.127.33',
          putInService: subMonths(now, 2),
          putInServiceSource: 'Installed at clinic',
          configurationData: '{}',
        },
        auditFields
      )
    )
  })

  // Fill Issue/AlertMessage/Notification table with some mock data
  const devices = await knex('Device as d')
    .join('Geography as g', 'g.id', 'd.geographyId')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('c.a3', 'USA')
    .select('d.*')
  const issueStatusActiveId = await getId(knex, 'IssueStatus', 'Active')
  const issueStatusAcknowledgedId = await getId(
    knex,
    'IssueStatus',
    'Acknowledged'
  )

  const issueStatusOkId = await getId(knex, 'IssueStatus', 'OK')
  const messageStatusSentId = await getId(knex, 'MessageStatus', 'Sent')

  const issue = {
    level: 1,
    partnerId: _.head(devices).partnerId,
    createdOn: subDays(now, _.random(1, 30)),
    updatedOn: subDays(now, _.random(1, 30)),
  }
  const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
  let issueIds = []
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
  }

  await Promise.all(
    _.map(devices, async device => {
      await Promise.all(
        _.map(luIssueTypeIds, async issueTypeId => {
          const issueStatusId =
            issueTypeId === issueTypes.StockLevelUpdate.id
              ? issueStatusOkId
              : issueStatusActiveId
          const [issueId] = await knex('Issue').insert(
            Object.assign(
              {
                issueTypeId,
                issueStatusId,
                deviceId: device.id,
                siteId: device.siteId,
                geographyId: device.geographyId,
              },
              issue
            )
          )
          if (issueStatusId === issueStatusAcknowledgedId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId: issueStatusActiveId,
              changedOn: now,
              createdOn: now,
              createdBy: userId,
            })
          }
          if (issueStatusId !== issueStatusActiveId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId,
              changedOn: new Date(+now + millisInHour),
              createdOn: new Date(+now + millisInHour - 1000),
              createdBy: userId,
            })
          }
          issueIds.push(issueId)
        })
      )
    })
  )
  const [jobFunctionIdLabUser] = await knex('JobFunction').insert({
    name: 'Lab USA User',
    partnerId: _.head(devices).partnerId,
  })
  const luPolicies = await knex('NotificationType as nt')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('Issue as i', 'i.issueTypeId', 'nt.issueTypeId')
    .join('Job as j', 'j.jobFunctionId', 'nt.jobFunctionId')
    .join('JobContext as jc', 'jc.jobId', 'j.id')
    .join('AlertTemplate as at', 'at.id', 'mt.alertTemplateId')
    .where({ 'nt.partnerId': _.head(devices).partnerId })
    .whereIn('i.id', issueIds)
    .where('nt.level', 1)
    .where('nt.jobFunctionId', jobFunctionIdLabUser)
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

  const [jobFunctionIdRegionalOfficer] = await knex('JobFunction').insert({
    name: 'Regional USA Officer',
    partnerId: _.head(devices).partnerId,
  })
  const deviceIds = await knex('Device as d')
    .select('j.personId', 'd.id as deviceId')
    .join('JobContext as jc', 'jc.siteId', 'd.siteId')
    .join('Job as j', 'jc.jobId', 'j.id')
    .where({ jobFunctionId: jobFunctionIdLabUser })
    .union(function() {
      this.select('j.personId', 'd.id as deviceId')
        .from('Device as d')
        .leftJoin('Geography as g1', 'd.geographyId', 'g1.id')
        .leftJoin('Geography as g2', 'g2.stateId', 'g1.stateId')
        .join('JobContext as jc', 'jc.geographyId', 'g2.id')
        .join('Job as j', 'jc.jobId', 'j.id')
        .where({
          partnerId: _.head(devices).partnerId,
          jobFunctionId: jobFunctionIdRegionalOfficer,
        })
    })
    .orderBy('deviceId')
    .reduce((memo, row) => {
      if (!memo[row.deviceId]) {
        memo[row.deviceId] = {}
      }
      memo[row.deviceId][row.personId] = row.deviceId
      return memo
    }, {})
  await Promise.all(
    _.map(luPolicies, async policy => {
      const deviceId = deviceIds[policy.deviceId][policy.personId]
      if (deviceId) {
        const [alertMessageId] = await knex('AlertMessage').insert(
          Object.assign(
            {
              messageStatusId: messageStatusSentId,
              message: luAlertMessages[policy.issueTypeId],
              createdOn: subDays(now, _.random(1, 30)),
              updatedOn: subDays(now, _.random(1, 30)),
            },
            _.pick(policy, [
              'alertTemplateId',
              'personId',
              'siteId',
              'deviceId',
              'resultId',
            ])
          )
        )

        await knex('Notification').insert(
          Object.assign(
            {
              createdOn: subDays(now, _.random(1, 30)),
              alertMessageId,
            },
            _.pick(policy, ['notificationTypeId', 'issueId', 'personId'])
          )
        )
      }
    })
  )

  // add issues for RO
  const roIssueTypeIds = [
    issueTypes.DeviceOffline.id,
    issueTypes.DeviceNoResults.id,
    issueTypes.ModuleProceduralError.id,
    issueTypes.MachineProceduralError.id,
    issueTypes.StockLevelUpdate.id,
    issueTypes.ReagentHealthError.id,
  ]

  issue.level = 2
  issueIds = []
  await Promise.all(
    _.map(devices, async device => {
      await Promise.all(
        _.map(roIssueTypeIds, async issueTypeId => {
          const issueStatusId =
            issueTypeId === issueTypes.StockLevelUpdate.id
              ? issueStatusOkId
              : issueStatusActiveId
          const [issueId] = await knex('Issue').insert(
            Object.assign(
              {
                issueTypeId,
                issueStatusId,
                deviceId: device.id,
                siteId: device.siteId,
                geographyId: device.geographyId,
              },
              issue
            )
          )
          if (issueStatusId === issueStatusAcknowledgedId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId: issueStatusActiveId,
              changedOn: subDays(now, _.random(1, 30)),
              createdOn: subDays(now, _.random(1, 30)),
              createdBy: userId,
            })
          }
          if (issueStatusId !== issueStatusActiveId) {
            await knex('IssueStatusLog').insert({
              issueId,
              issueStatusId,
              changedOn: new Date(+now + millisInHour),
              createdOn: new Date(+now + millisInHour - 1000),
              createdBy: userId,
            })
          }
          issueIds.push(issueId)
        })
      )
    })
  )

  // read 1st Result and coresponding
  const issues = await knex('Issue as i')
    .join('IssueStatus as is', 'i.issueStatusId', 'is.id')
    .join('IssueType as it', 'i.issueTypeId', 'it.id')
    .join('IssueCategory as ic', 'it.issueCategoryId', 'ic.id')
    .join('Site as s', 'i.siteId', 's.id')
    .join('Geography as g', 's.geographyid', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('c.a3', 'USA')
    .select('i.id', 'i.deviceId', 'i.siteId')
    .limit(100)

  const messageStatusId = await messageStatusToId('Initial')
  await Promise.each(issues, async elem => {
    // add sample alert message
    const now = new Date(new Date().toDateString())
    const idTemplate = Math.floor(Math.random() * 9) + 1
    const insertedid = await knex('AlertMessage')
      .returning('id')
      .insert({
        alertTemplateId: idTemplate,
        messageStatusId,
        message: `Test message ${idTemplate}`,
        personId,
        siteId: elem.siteId,
        deviceId: elem.deviceId,
        createdOn: subDays(now, _.random(1, 30)),
        updatedOn: subDays(now, _.random(1, 30)),
      })
    await knex('Notification').insert(
      Object.assign({
        createdOn: subDays(now, _.random(1, 30)),
        alertMessageId: insertedid,
        issueId: elem.id,
        personId,
        notificationTypeId: 1,
      })
    )
  })
}

async function getId(knex, table, externalId) {
  const { id } = await knex(table)
    .where({ externalId })
    .first('id')
  return id
}
