module.exports = require('../../src/db').seed(seed)
const geography = require('./fixtures/geography.json')
const _ = require('lodash')

async function seed(knex) {
  const { id: jobFunctionIdRegionalOfficer, partnerId } = await knex(
    'JobFunction as jf'
  )
    .join('Partner as p', 'p.id', 'jf.partnerId')
    .where({ 'p.name': 'Myanmar', 'jf.name': 'Regional Officer' })
    .first('jf.id', 'p.id as partnerId')

  const [issueTypes, defaultMessageTypes] = await Promise.all([
    rowsAsObject(knex, 'IssueType', 'externalId'),
    getDefaultMessageTypes(knex),
  ])

  const roLuNetworkNotificationType = await knex('NotificationType')
    .where({
      jobFunctionId: jobFunctionIdRegionalOfficer,
      issueTypeId: issueTypes.DeviceOffline.id,
      level: 1,
    })
    .first()

  if (roLuNetworkNotificationType != null) {
    return
  }

  const now = new Date()
  const { id: adminId } = await knex('User as u')
    .where({ 'u.name': 'myanmar_admin' })
    .first('u.id')
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }

  // Notifications
  await knex('NotificationType').insert([
    Object.assign(
      {
        name: 'LU Network - RO View',
        partnerId,
        issueTypeId: issueTypes.DeviceOffline.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceOffline.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU No Testing - RO View',
        partnerId,
        issueTypeId: issueTypes.DeviceNoResults.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DeviceNoResults.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Failure - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Failure - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleFailureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleFailureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Power - RO View',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Power - RO View',
        partnerId,
        issueTypeId: issueTypes.ModulePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModulePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Temperature - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineTemperatureError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineTemperatureError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Power - RO View',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Power - RO View',
        partnerId,
        issueTypeId: issueTypes.MachinePowerError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachinePowerError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Module Generic - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleGenericError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleGenericError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Module Generic - RO View',
        partnerId,
        issueTypeId: issueTypes.ModuleGenericError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ModuleGenericError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Machine Generic - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineGenericError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineGenericError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Machine Generic - RO View',
        partnerId,
        issueTypeId: issueTypes.MachineGenericError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.MachineGenericError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Reagent Health - RO View',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Escalated Reagent Health - RO View',
        partnerId,
        issueTypeId: issueTypes.ReagentHealthError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 2,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.ReagentHealthError.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Stock Level Update - RO View',
        partnerId,
        issueTypeId: issueTypes.StockLevelUpdate.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.StockLevelUpdate.id,
      },
      auditFields
    ),
    Object.assign(
      {
        name: 'LU Data Category Low - RO View',
        partnerId,
        issueTypeId: issueTypes.DataCategoryLowError.id,
        jobFunctionId: jobFunctionIdRegionalOfficer,
        level: 1,
        canAcknowledge: 0,
        messageTypeId: defaultMessageTypes.DataCategoryLowError.id,
      },
      auditFields
    ),
  ])

  // remove decimals from target data collection
  await knex('DashboardWidgetTarget').update({
    sqlForDataCollection: knex.raw(
      "replace(sqlForDataCollection, '100,2),', '100,0),')"
    ),
  })

  // adjust RR rate to be a percentage
  await knex('DashboardWidget')
    .where({ title: 'RR Rate' })
    .update({
      sqlForIndicator:
        "SELECT ifnull(concat(round(sum(CASE WHEN f.resultCategory2=1 AND f.resultCategory1 = 1 THEN f.resultCount ELSE 0 END)/sum(CASE WHEN f.resultCategory1 = 1 THEN f.resultCount ELSE 0 END) * 100, 0), '%'), '0%') AS cnt FROM FactResultsDeviceByCategory1And2 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON s.partnerId = p.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE f.assayId IN (1,2) AND f.days = 30",
    })

  // Change TI subtitle
  await knex('DashboardWidgetStat')
    .where({ statStatus: 'Trace Indet.' })
    .update({
      statStatus: 'Indeterminate',
    })

  // Change TI calculation
  await knex('DashboardWidget')
    .where({ title: 'TI Rate' })
    .update({
      sqlForIndicator:
        "SELECT ifnull(concat(round(sum(CASE WHEN f.resultCategory2=4 AND f.resultCategory1 = 1 THEN f.resultCount ELSE 0 END)/sum(CASE WHEN f.resultCategory1 = 1 THEN f.resultCount ELSE 0 END) * 100, 0), '%'), '0%') AS cnt FROM FactResultsDeviceByCategory1And2 AS f INNER JOIN Device AS d ON d.id = f.deviceId INNER JOIN Site AS s ON s.id = d.siteId INNER JOIN Partner AS p ON s.partnerId = p.id LEFT OUTER JOIN Geography AS g ON s.geographyId = g.id WHERE f.assayId IN (1,2) AND f.days = 30",
    })

  // update Targets for the states with real values
  await Promise.all(
    _.map(geography.countries[0].states, async state => {
      const geography = await knex('Geography')
        .join('State', 'Geography.stateId', 'State.id')
        .whereNotNull('stateId')
        .whereNull('lgaId')
        .where('State.name', state.name)
        .first('Geography.id')

      await Promise.all(
        _.map(state.targets, async (value, key) => {
          await knex('Target')
            .where({ geographyId: geography.id })
            .where({ targetToken: key })
            .update({ targetValue: value })
        })
      )
    })
  )

  // update ro stock level update to be acknowledgable
  await knex('NotificationType')
    .where('name', 'RO Stock Level Update')
    .update('canAcknowledge', 1)
}

function rowsAsObject(knex, table, column = 'name') {
  return knex(table).reduce((memo, row) => {
    memo[row[column]] = row
    return memo
  }, {})
}

function getDefaultMessageTypes(knex) {
  return knex('MessageType as mt')
    .join('IssueType as it', 'it.defaultMessageTypeId', 'mt.id')
    .select('it.externalId as issueTypeExternalId', 'mt.*')
    .reduce((memo, row) => {
      memo[row.issueTypeExternalId] = row
      return memo
    }, {})
}
