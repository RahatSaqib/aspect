module.exports = require('../../src/db').seed(seed)

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
        name: 'LU Network',
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
        name: 'LU No Testing',
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
        name: 'LU Module Failure',
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
        name: 'LU Escalated Module Failure',
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
        name: 'LU Module Temperature',
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
        name: 'LU Escalated Module Temperature',
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
        name: 'LU Module Power',
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
        name: 'LU Escalated Module Power',
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
        name: 'LU Machine Temperature',
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
        name: 'LU Escalated Machine Temperature',
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
        name: 'LU Machine Power',
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
        name: 'LU Escalated Machine Power',
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
        name: 'LU Module Generic',
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
        name: 'LU Escalated Module Generic',
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
        name: 'LU Machine Generic',
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
        name: 'LU Escalated Machine Generic',
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
        name: 'LU Reagent Health',
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
        name: 'LU Escalated Reagent Health',
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
        name: 'LU Stock Level Update',
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
        name: 'LU Data Category Low',
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
