module.exports = require('../utils').seed(seed, __filename)

const { subDays, subMonths, addDays } = require('date-fns')
const _ = require('lodash')
const Promise = require('bluebird')

const { rowsAsObject } = require('../utils')
const { messageStatusToId } = require('../../src/shared/dictionary')
const { insertDeviceWithGeneratedName } = require('../common/insertDeviceWithGeneratedName')
const { formatDateOrDefault } = require('../../src/shared/date')

const millisInHour = 1000 * 60 * 60
const now = new Date()

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
  const deviceType = await knex('DeviceType').where('externalId', 'CepheidGeneXpert').first()
  const { deviceApprovalId } = await knex('DeviceApproval').where('token', 'approved').first('id as deviceApprovalId')
  const sites = await knex('Site as s')
    .join('Geography as g', 's.geographyid', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('c.a3', 'USA')
    .orderBy('s.updatedOn')
    .select('s.*')
  await Promise.each(new Array(4), async () => {
    const site = _.sample(sites)
    await insertDeviceWithGeneratedName(knex, {
      partnerId: site.partnerId,
      siteId: site.id,
      deviceTypeId: deviceType.id,
      deviceApprovalId,
      serial: `S1-D-${_.random(100000, 999999)}`,
      lastSeenOn: subDays(now, _.random(1, 30)),
      lastPingOn: subDays(now, _.random(1, 30)),
      lastPingFromIp: '41.70.127.33',
      putInService: subMonths(now, 2),
      putInServiceSource: 'Installed at clinic',
      configurationData: '{}',
      ...auditFields,
    })
  })

  // Fill Issue/AlertMessage/Notification table with some mock data
  const devices = await knex('Device as d')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .join('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .join('Site as s', 'd.siteId', 's.id')
    .join('Geography as g', 's.geographyId', 'g.id')
    .join('Country as c', 'g.countryId', 'c.id')
    .where('c.a3', 'USA')
    .where('dtc.name', 'Lab')
    .select('d.*', 's.geographyId')
  const issueStatusActiveId = await getId(knex, 'IssueStatus', 'Active')
  const issueStatusResolvedId = await getId(knex, 'IssueStatus', 'Resolved')
  const issueStatusAcknowledgedId = await getId(knex, 'IssueStatus', 'Acknowledged')
  const consumableIds = await knex('Consumable').where('manufacturer', 'Cepheid').select('id')
  const issue = {
    level: 1,
    partnerId: _.head(devices).partnerId,
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
    issueTypes.InventoryStockout.id,
    issueTypes.InventoryStockExpiring.id,
  ]

  await Promise.all(
    _.map(_.take(devices, 20), async device => {
      await Promise.all(
        _.map(luIssueTypeIds, async issueTypeId => {
          const isStockIssue = _.includes(
            [issueTypes.StockLevelUpdate.id, issueTypes.InventoryStockout.id, issueTypes.InventoryStockExpiring.id],
            issueTypeId
          )
          const issueDate = subDays(now, _.random(1, 90))
          const issueStatusId =
            issueDate > subDays(now, 5)
              ? _.random(1) === 1
                ? issueStatusActiveId
                : issueStatusAcknowledgedId
              : issueStatusResolvedId
          const [issueId] = await knex('Issue').insert({
            issueTypeId,
            issueStatusId,
            deviceId: isStockIssue ? null : device.id,
            siteId: device.siteId,
            geographyId: device.geographyId,
            createdOn: issueDate,
            updatedOn: issueDate,
            consumableId: isStockIssue ? consumableIds[_.random(consumableIds.length - 1)].id : null,
            ...issue,
          })
          if (issueStatusId === issueStatusAcknowledgedId || issueStatusId === issueStatusResolvedId) {
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

  // add issues for RO
  const roIssueTypeIds = [
    issueTypes.DeviceOffline.id,
    issueTypes.DeviceNoResults.id,
    issueTypes.ModuleProceduralError.id,
    issueTypes.MachineProceduralError.id,
    issueTypes.StockLevelUpdate.id,
    issueTypes.ReagentHealthError.id,
    issueTypes.InventoryStockout.id,
    issueTypes.InventoryStockExpiring.id,
  ]

  issue.level = 2
  issueIds = []
  await Promise.all(
    _.map(_.take(devices, 20), async device => {
      await Promise.all(
        _.map(roIssueTypeIds, async issueTypeId => {
          const issueDate = subDays(now, _.random(1, 90))
          const isStockIssue = _.includes(
            [issueTypes.StockLevelUpdate.id, issueTypes.InventoryStockout.id, issueTypes.InventoryStockExpiring.id],
            issueTypeId
          )
          const issueStatusId =
            issueDate > subDays(now, 5)
              ? _.random(1) === 1
                ? issueStatusActiveId
                : issueStatusAcknowledgedId
              : issueStatusResolvedId
          const [issueId] = await knex('Issue').insert({
            issueTypeId,
            issueStatusId,
            deviceId: isStockIssue ? null : device.id,
            siteId: device.siteId,
            geographyId: device.geographyId,
            createdOn: issueDate,
            updatedOn: issueDate,
            consumableId: isStockIssue ? consumableIds[_.random(consumableIds.length - 1)].id : null,
            ...issue,
          })
          if (issueStatusId === issueStatusAcknowledgedId || issueStatusId === issueStatusResolvedId) {
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
    .join('NotificationType as nt', 'i.issueTypeId', 'nt.issueTypeId')
    .join('MessageType as mt', 'nt.messageTypeId', 'mt.id')
    .join('AlertTemplate as at', 'mt.alertTemplateId', 'at.id')
    .where('c.a3', 'USA')
    .select(
      'i.id',
      'i.createdOn',
      'i.deviceId',
      'i.siteId',
      'at.message',
      knex.raw('min(mt.alertTemplateId) as alertTemplateId')
    )
    .groupBy('i.id', 'i.createdOn', 'i.deviceId', 'i.siteId', 'at.message')

  const messageStatusId = await messageStatusToId('Sent')
  await Promise.each(issues, async issue => {
    // add sample alert message
    const [alertMessageId] = await knex('AlertMessage').insert({
      alertTemplateId: issue.alertTemplateId,
      messageStatusId,
      message: fillPlaceholders(issue.message),
      personId,
      siteId: issue.siteId,
      deviceId: issue.deviceId,
      createdOn: issue.createdOn,
      updatedOn: issue.createdOn,
    })
    await knex('Notification').insert({
      createdOn: issue.createdOn,
      alertMessageId,
      issueId: issue.id,
      personId,
      notificationTypeId: 1,
    })
  })
}

async function getId(knex, table, externalId) {
  const { id } = await knex(table).where({ externalId }).first('id')
  return id
}

function fillPlaceholders(message) {
  return message
    .replace('{{numberOfDays device.lastPingOn}}', `${_.random(6, 30)} days`)
    .replace('{{issue.data.moduleName}}', `${['A', 'B', 'C', 'D'][_.random(0, 3)]}${_.random(1, 4)}`)
    .replace('{{numberOfDays issue.data.lastResultOn}}', `${_.random(12, 30)} days`)
    .replace('{{formatDate issue.data.date}}', formatDateOrDefault(addDays(new Date(), 26), 'MM/dd/yyyy'))
    .replace('{{issue.data.totalWasted}}', _.random(100, 10000))
}
