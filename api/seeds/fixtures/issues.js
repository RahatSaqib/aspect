const now = new Date()
const {
  allIssueCategoryToId,
  allMessageSeverityToId,
} = require('../../src/shared/dictionary')
const { insertNewResultPushTemplates } = require('../commonPushNotifications')

async function addIssuesAndNotifications(knex) {
  const lastIssueType = await knex('IssueType')
    .where({ externalId: 'NewResultsAvailable' })
    .first('id as lastIssueType')

  if (lastIssueType) {
    return
  }

  const { adminId, partnerId } = await knex('User as u')
    .join('Person as p', 'u.id', 'p.userId')
    .where('u.name', 'admin')
    .first('p.userId as adminId', 'p.lastPartnerId as partnerId')
  if (!adminId)
    throw Error(
      'You need to insert, as a first action in your first seed file, the admin user'
    )
  const auditFields = {
    createdOn: now,
    createdBy: adminId,
    updatedOn: now,
    updatedBy: adminId,
  }
  // Messages
  const [deviceOfflineAlertTemplateId] = await knex('AlertTemplate').insert({
    message: 'Cannot reach network for {{numberOfDays device.lastPingOn}}',
    ...auditFields,
  })

  const [deviceOfflineSmsTemplateId] = await knex('SmsTemplate').insert({
    message:
      '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
    ...auditFields,
  })

  const [deviceOfflineEmailTemplateId] = await knex('EmailTemplate').insert({
    subject:
      '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
    body:
      '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
    htmlBody:
      '<em>{{site.name}}</em> cannot reach network for {{numberOfDays device.lastPingOn}}',
    ...auditFields,
  })
  // Module temperature messages
  const [moduleTemperatureErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert({
    message:
      'Temperature errors on Module {{issue.data.moduleName}}; notify RO',
    ...auditFields,
  })

  const [moduleTemperatureErrorSmsTemplateId] = await knex(
    'SmsTemplate'
  ).insert({
    message:
      '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO',
    ...auditFields,
  })

  const [moduleTemperatureErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert({
    subject:
      '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}',
    body:
      '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
    htmlBody:
      '<em>{{device.name}}</em> has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
    ...auditFields,
  })

  // Module power error messages
  const [modulePowerErrorAlertTemplateId] = await knex('AlertTemplate').insert({
    message: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
    ...auditFields,
  })

  const [modulePowerErrorSmsTemplateId] = await knex('SmsTemplate').insert({
    message:
      '{{device.name}} has power errors on Module {{issue.data.moduleName}}; notify RO',
    ...auditFields,
  })

  const [modulePowerErrorEmailTemplateId] = await knex('EmailTemplate').insert({
    subject:
      '{{device.name}} has power errors on module {{issue.data.moduleName}}',
    body:
      '{{device.name}} has power errors on module {{issue.data.moduleName}}; notify RO',
    htmlBody:
      '{{device.name}} has power errors on module <em>{{issue.data.moduleName}}</em>; notify RO',
    ...auditFields,
  })

  // Module failure error messages
  const [moduleFailureErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert({
    message: 'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
    ...auditFields,
  })

  const [moduleFailureErrorSmsTemplateId] = await knex('SmsTemplate').insert({
    message:
      'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
    ...auditFields,
  })

  const [moduleFailureErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert({
    subject: '{{device.name}}: Critical Module Errors',
    body:
      'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
    htmlBody:
      'Module <em>{{issue.data.moduleName}}</em> in {{device.name}}: Critical errors; notify RO',
    ...auditFields,
  })

  const [deviceNoResultsAlertTemplateId] = await knex('AlertTemplate').insert({
    message: 'No testing for {{numberOfDays issue.data.lastResultOn}}',
    ...auditFields,
  })

  const [deviceNoResultsSmsTemplateId] = await knex('SmsTemplate').insert({
    message:
      '{{device.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
    ...auditFields,
  })

  const [deviceNoResultsEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: '{{device.name}}: No Testing',
    body: '{{device.name}} no testing {{numberOfDays issue.data.lastResultOn}}',
    htmlBody:
      '<em>{{device.name}}</em> no testing for {{numberOfDays issue.data.lastResultOn}}',
    ...auditFields,
  })

  const [deviceMaintenanceAlertTemplateId] = await knex('AlertTemplate').insert(
    {
      message: 'Under Maintenance',
      ...auditFields,
    }
  )

  const [deviceMaintenanceSmsTemplateId] = await knex('SmsTemplate').insert({
    message: '{{site.name}} under maintenance.',
    ...auditFields,
  })

  const [deviceMaintenanceEmailTemplateId] = await knex('EmailTemplate').insert(
    {
      subject: '{{site.name}} Maintenance',
      body: '{{site.name}} under maintenance.',
      htmlBody: '<em>{{site.name}}</em> maintenance',
      ...auditFields,
    }
  )

  // Machine temperature error messages
  const [machineTemperatureErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert({
    message: 'Temperature errors across machine, conduct troubleshooting.',
    ...auditFields,
  })

  const [machineTemperatureErrorSmsTemplateId] = await knex(
    'SmsTemplate'
  ).insert({
    message:
      '{{device.name}}: Temperature errors across machine, conduct troubleshooting',
    ...auditFields,
  })

  const [machineTemperatureErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert({
    subject: '{{device.name}}: Machine Temperature Errors',
    body:
      '{{device.name}}: Temperature errors across machine, conduct troubleshooting.',
    htmlBody:
      '<em>{{device.name}}</em>: Temperature errors across machine, conduct troubleshooting.',
    ...auditFields,
  })

  // Module Procedural issue messages
  const [moduleProceduralErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert({
    message:
      'Possible module failure on module {{issue.data.moduleName}} contact engineer',
    ...auditFields,
  })

  const [moduleProceduralErrorSmsTemplateId] = await knex('SmsTemplate').insert(
    {
      message:
        '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
      ...auditFields,
    }
  )

  const [moduleProceduralErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert({
    subject: '{{device.name}}: Possible module failure',
    body:
      '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
    htmlBody:
      '{{device.name}}: Possible module failure on module <em>{{issue.data.moduleName}}</em> contact engineer',
    ...auditFields,
  })

  // Machine Power issue templates
  const [machinePowerErrorAlertTemplateId] = await knex('AlertTemplate').insert(
    {
      message: 'Power error across machine, conduct troubleshooting',
      ...auditFields,
    }
  )

  const [machinePowerErrorSmsTemplateId] = await knex('SmsTemplate').insert({
    message:
      '{{device.name}}: Power error across machine, conduct troubleshooting.',
    ...auditFields,
  })

  const [machinePowerErrorEmailTemplateId] = await knex('EmailTemplate').insert(
    {
      subject: '{{device.name}}: Power error across machine',
      body:
        '{{device.name}}: Power error across machine, conduct troubleshooting.',
      htmlBody:
        '<em>{{device.name}}</em>: Power error across machine, conduct troubleshooting.',
      ...auditFields,
    }
  )

  // Machine Procedural issue templates
  const [machineProceduralErrorAlertTemplateId] = await knex(
    'AlertTemplate'
  ).insert({
    message: 'Procedural errors across machine, conduct troubleshooting',
    ...auditFields,
  })

  const [machineProceduralErrorSmsTemplateId] = await knex(
    'SmsTemplate'
  ).insert({
    message:
      '{{device.name}}: Procedural errors across machine, conduct troubleshooting',
    ...auditFields,
  })

  const [machineProceduralErrorEmailTemplateId] = await knex(
    'EmailTemplate'
  ).insert({
    subject: '{{device.name}}: Procedural Errors',
    body:
      '{{device.name}}: Procedural errors across machine, conduct troubleshooting.',
    htmlBody:
      '<em>{{device.name}}</em>: Procedural errors across machine, conduct troubleshooting.',
    ...auditFields,
  })

  // Data Category Low issue templates
  const [dataCategoryLowAlertTemplateId] = await knex('AlertTemplate').insert({
    message:
      '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    ...auditFields,
  })

  const [dataCategoryLowSmsTemplateId] = await knex('SmsTemplate').insert({
    message:
      '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    ...auditFields,
  })

  const [dataCategoryLowEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: 'Low Collection Rate',
    body:
      '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    htmlBody:
      '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    ...auditFields,
  })

  // Stock level update issue templates
  const [stockLevelUpdateAlertTemplateId] = await knex('AlertTemplate').insert({
    message: 'Update Stock Level',
    ...auditFields,
  })

  const [stockLevelUpdateSmsTemplateId] = await knex('SmsTemplate').insert({
    message: '{{site.name}} - Update Stock Level',
    ...auditFields,
  })

  const [stockLevelUpdateEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: '{{site.name}} - Update Stock Level',
    body: '{{site.name}} - Update Stock Level',
    htmlBody: '{{site.name}} - Update Stock Level',
    ...auditFields,
  })

  // Stock level update issue templates
  const [reagentHealthAlertTemplateId] = await knex('AlertTemplate').insert({
    message: 'Cartridge-specific errors exceed 5%',
    ...auditFields,
  })

  const [reagentHealthSmsTemplateId] = await knex('SmsTemplate').insert({
    message: '{{device.name}} - Cartridge-specific errors exceed 5%',
    ...auditFields,
  })

  const [reagentHealthEmailTemplateId] = await knex('EmailTemplate').insert({
    subject: '{{device.name}} - Cartridge-specific errors exceed 5%',
    body: '{{device.name}} - Cartridge-specific errors exceed 5%',
    htmlBody: '{{device.name}} - Cartridge-specific errors exceed 5%',
    ...auditFields,
  })

  const messageSeverities = await allMessageSeverityToId()

  const [deviceOfflineMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: deviceOfflineAlertTemplateId,
    smsTemplateId: deviceOfflineSmsTemplateId,
    emailTemplateId: deviceOfflineEmailTemplateId,
  })

  const [deviceNoResultsMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: deviceNoResultsAlertTemplateId,
    smsTemplateId: deviceNoResultsSmsTemplateId,
    emailTemplateId: deviceNoResultsEmailTemplateId,
  })

  const [deviceMaintenanceMessageTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Recommendation,
    alertTemplateId: deviceMaintenanceAlertTemplateId,
    smsTemplateId: deviceMaintenanceSmsTemplateId,
    emailTemplateId: deviceMaintenanceEmailTemplateId,
  })

  const [moduleFailureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: moduleFailureErrorAlertTemplateId,
    smsTemplateId: moduleFailureErrorSmsTemplateId,
    emailTemplateId: moduleFailureErrorEmailTemplateId,
  })

  const [moduleTemperatureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: moduleTemperatureErrorAlertTemplateId,
    smsTemplateId: moduleTemperatureErrorSmsTemplateId,
    emailTemplateId: moduleTemperatureErrorEmailTemplateId,
  })

  const [modulePowerErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: modulePowerErrorAlertTemplateId,
    smsTemplateId: modulePowerErrorSmsTemplateId,
    emailTemplateId: modulePowerErrorEmailTemplateId,
  })

  const [machineTemperatureErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: machineTemperatureErrorAlertTemplateId,
    smsTemplateId: machineTemperatureErrorSmsTemplateId,
    emailTemplateId: machineTemperatureErrorEmailTemplateId,
  })

  const [machinePowerErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: machinePowerErrorAlertTemplateId,
    smsTemplateId: machinePowerErrorSmsTemplateId,
    emailTemplateId: machinePowerErrorEmailTemplateId,
  })

  const [moduleProceduralErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: moduleProceduralErrorAlertTemplateId,
    smsTemplateId: moduleProceduralErrorSmsTemplateId,
    emailTemplateId: moduleProceduralErrorEmailTemplateId,
  })

  const [machineProceduralErrorTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: machineProceduralErrorAlertTemplateId,
    smsTemplateId: machineProceduralErrorSmsTemplateId,
    emailTemplateId: machineProceduralErrorEmailTemplateId,
  })

  const [dataCategoryLowTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: dataCategoryLowAlertTemplateId,
    smsTemplateId: dataCategoryLowSmsTemplateId,
    emailTemplateId: dataCategoryLowEmailTemplateId,
  })

  const [stockLevelUpdateTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Recommendation,
    alertTemplateId: stockLevelUpdateAlertTemplateId,
    smsTemplateId: stockLevelUpdateSmsTemplateId,
    emailTemplateId: stockLevelUpdateEmailTemplateId,
  })

  const [reagentHealthTypeId] = await knex('MessageType').insert({
    messageSeverityId: messageSeverities.Alert,
    alertTemplateId: reagentHealthAlertTemplateId,
    smsTemplateId: reagentHealthSmsTemplateId,
    emailTemplateId: reagentHealthEmailTemplateId,
  })

  // Issues
  const issueCategories = await allIssueCategoryToId()
  await knex('IssueType').insert([
    {
      name: 'Result Received',
      externalId: 'ResultReceived',
      i18nKey: 'issueTypeResultReceived',
      issueCategoryId: issueCategories.DataHealth,
    },
    {
      name: 'Device Offline',
      externalId: 'DeviceOffline',
      i18nKey: 'issueStatusDeviceOffline',
      issueCategoryId: issueCategories.ConnectivityHealth,
      defaultMessageTypeId: deviceOfflineMessageTypeId,
    },
    {
      name: 'Device No Results',
      externalId: 'DeviceNoResults',
      i18nKey: 'issueStatusDeviceNoResults',
      issueCategoryId: issueCategories.ConnectivityHealth,
      defaultMessageTypeId: deviceNoResultsMessageTypeId,
    },
    {
      name: 'Device Maintenance',
      externalId: 'DeviceMaintenance',
      i18nKey: 'issueTypeDeviceMaintenance',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: deviceMaintenanceMessageTypeId,
    },
    {
      name: 'Module Failure Error',
      externalId: 'ModuleFailureError',
      i18nKey: 'issueStatusModuleFailureError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: moduleFailureErrorTypeId,
    },
    {
      name: 'Module Temperature Error',
      externalId: 'ModuleTemperatureError',
      i18nKey: 'issueStatusModuleTemperatureError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: moduleTemperatureErrorTypeId,
    },
    {
      name: 'Module Power Error',
      externalId: 'ModulePowerError',
      i18nKey: 'issueStatusModulePowerError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: modulePowerErrorTypeId,
    },
    {
      name: 'Machine Temperature Error',
      externalId: 'MachineTemperatureError',
      i18nKey: 'issueStatusMachineTemperatureError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: machineTemperatureErrorTypeId,
    },
    {
      name: 'Machine Power Error',
      externalId: 'MachinePowerError',
      i18nKey: 'issueStatusMachinePowerError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: machinePowerErrorTypeId,
    },
    {
      name: 'Module Procedural Error',
      externalId: 'ModuleProceduralError',
      i18nKey: 'issueStatusModuleProceduralError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: moduleProceduralErrorTypeId,
    },
    {
      name: 'Machine Procedural Error',
      externalId: 'MachineProceduralError',
      i18nKey: 'issueStatusMachineProceduralError',
      issueCategoryId: issueCategories.DeviceHealth,
      defaultMessageTypeId: machineProceduralErrorTypeId,
    },
    {
      name: 'Data Category Low Error',
      externalId: 'DataCategoryLowError',
      i18nKey: 'issueStatusMachineProceduralError',
      issueCategoryId: issueCategories.DataHealth,
      defaultMessageTypeId: dataCategoryLowTypeId,
    },
    {
      name: 'Stock Level Update',
      externalId: 'StockLevelUpdate',
      i18nKey: 'stockLevelUpdateIssue',
      issueCategoryId: issueCategories.ReagentHealth,
      defaultMessageTypeId: stockLevelUpdateTypeId,
    },
    {
      name: 'Reagent Health Error',
      externalId: 'ReagentHealthError',
      i18nKey: 'reagentHealthError',
      issueCategoryId: issueCategories.ReagentHealth,
      defaultMessageTypeId: reagentHealthTypeId,
    },
    {
      name: 'Module Replaced',
      externalId: 'ModuleReplaced',
      i18nKey: 'issueTypeModuleReplaced',
      issueCategoryId: issueCategories.DeviceHealth,
    },
  ])
  await insertNewResultPushTemplates(knex, adminId, partnerId)
}

module.exports = {
  addIssuesAndNotifications,
}
