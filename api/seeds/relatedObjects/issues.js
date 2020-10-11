const {
  allIssueCategoryToId,
  allMessageSeverityToId,
} = require('../../src/shared/dictionary')

const msgInstrumentReplaced = `{{device.name}}:
  Instrument "{{issue.data.replacedInstrumentSerial}}" has been replaced to
  "{{issue.data.newInstrumentSerial}}"
`
const regexBreakline = /\n+/gm
const errorIssueAlertModule = ` ({{result.errorCode}}) on ({{result.moduleSerial}}) at {{site.name}}`

const errorIssueEmailModule = ` ({{result.errorCode}}) on ({{result.moduleSerial}}) at {{site.name}}

  Total {{result.errorCode}} errors in the last 30 days: {{issue.data.resultsWithErrors}}

  Country: {{country.name}}

  Lab contacts: {{site.contacts}}

  Instrument Serial: {{result.instrumentSerial}}

  Software Version: {{result.softwareVersion}}

  Cartridge Type: {{result.assay.name}}

  Sender User: {{result.senderOperator}}

  Test Outcome: {{issue.data.resultOutcome}}

  Module Serial: {{result.moduleSerial}}

  Module Slot: {{result.moduleName}} `

const errorIssueAlertLot =
  ' ({{result.errorCode}}) on lot ({{result.consumableLot}}) at {{site.name}}'

const errorIssueEmailLot = ` ({{result.errorCode}}) on Lot ({{result.consumableLot}}) at {{site.name}}

Total {{result.errorCode}} errors in the last 30 days: {{issue.data.resultsWithErrors}}

Country: {{country.name}}

Lab contacts: {{site.contacts}}

Instrument Serial: {{result.moduleSerial}}

Software Version: {{result.softwareVersion}}

Cartridge Type: {{result.assay.name}}

Sender User: {{result.senderOperator}}

Test Outcome: {{issue.data.resultOutcome}}

Reagent Lot: {{result.consumableLot}}`

async function getBaseIssues(auditFields) {
  // Issues
  const issueCategories = await allIssueCategoryToId()
  const messageSeverities = await allMessageSeverityToId()
  const IssueDefinition = {
    ResultReceived: {
      issueType: {
        name: 'Result Received',
        externalId: 'ResultReceived',
        i18nKey: 'issueTypeResultReceived',
        issueCategoryId: issueCategories.DataHealth,
      },
    },
    DeviceOffline: {
      issueType: {
        name: 'Device Offline',
        externalId: 'DeviceOffline',
        i18nKey: 'issueStatusDeviceOffline',
        issueCategoryId: issueCategories.ConnectivityHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Cannot reach network for {{numberOfDays device.lastPingOn}}',
        ...auditFields,
      },
      SmsTemplate: {
        message:
          '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
        ...auditFields,
      },
      EmailTemplate: {
        subject:
          '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
        body:
          '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
        htmlBody:
          '<em>{{site.name}}</em> cannot reach network for {{numberOfDays device.lastPingOn}}',
        ...auditFields,
      },
    },
    DeviceNoResults: {
      issueType: {
        name: 'Device No Results',
        externalId: 'DeviceNoResults',
        i18nKey: 'issueStatusDeviceNoResults',
        issueCategoryId: issueCategories.ConnectivityHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'No testing for {{numberOfDays issue.data.lastResultOn}}',
        ...auditFields,
      },

      SmsTemplate: {
        message:
          '{{device.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: No Testing',
        body:
          '{{device.name}} no testing {{numberOfDays issue.data.lastResultOn}}',
        htmlBody:
          '<em>{{device.name}}</em> no testing for {{numberOfDays issue.data.lastResultOn}}',
        ...auditFields,
      },
    },
    DeviceMaintenance: {
      issueType: {
        name: 'Device Maintenance',
        externalId: 'DeviceMaintenance',
        i18nKey: 'issueTypeDeviceMaintenance',
        issueCategoryId: issueCategories.DeviceHealth,
        // defaultMessageTypeId: deviceMaintenanceMessageTypeId,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Recommendation,
      },
      AlertTemplate: {
        message: 'Under Maintenance',
        ...auditFields,
      },

      SmsTemplate: {
        message: '{{site.name}} under maintenance.',
        ...auditFields,
      },

      EmailTemplate: {
        subject: '{{site.name}} Maintenance',
        body: '{{site.name}} under maintenance.',
        htmlBody: '<em>{{site.name}}</em> maintenance',
        ...auditFields,
      },
    },
    ModuleFailureError: {
      issueType: {
        name: 'Module Failure Error',
        externalId: 'ModuleFailureError',
        i18nKey: 'issueStatusModuleFailureError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message:
          'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
        ...auditFields,
      },
      SmsTemplate: {
        message:
          'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: Critical Module Errors',
        body:
          'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
        htmlBody:
          'Module <em>{{issue.data.moduleName}}</em> in {{device.name}}: Critical errors; notify RO',
        ...auditFields,
      },
    },
    ModuleTemperatureError: {
      issueType: {
        name: 'Module Temperature Error',
        externalId: 'ModuleTemperatureError',
        i18nKey: 'issueStatusModuleTemperatureError',
        issueCategoryId: issueCategories.DeviceHealth,
        // defaultMessageTypeId: moduleTemperatureErrorTypeId,
      },
      MessageType: { messageSeverityId: messageSeverities.Alert },

      AlertTemplate: {
        message:
          'Temperature errors on Module {{issue.data.moduleName}}; notify RO',
        ...auditFields,
      },
      SmsTemplate: {
        message:
          '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO',
        ...auditFields,
      },

      EmailTemplate: {
        subject:
          '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}',
        body:
          '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
        htmlBody:
          '<em>{{device.name}}</em> has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
        ...auditFields,
      },
    },
    ModulePowerError: {
      issueType: {
        name: 'Module Power Error',
        externalId: 'ModulePowerError',
        i18nKey: 'issueStatusModulePowerError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Power errors on Module {{issue.data.moduleName}}; notify RO',
        ...auditFields,
      },
      SmsTemplate: {
        message:
          '{{device.name}} has power errors on Module {{issue.data.moduleName}}; notify RO',
        ...auditFields,
      },
      EmailTemplate: {
        subject:
          '{{device.name}} has power errors on module {{issue.data.moduleName}}',
        body:
          '{{device.name}} has power errors on module {{issue.data.moduleName}}; notify RO',
        htmlBody:
          '{{device.name}} has power errors on module <em>{{issue.data.moduleName}}</em>; notify RO',
        ...auditFields,
      },
    },
    MachineTemperatureError: {
      issueType: {
        name: 'Machine Temperature Error',
        externalId: 'MachineTemperatureError',
        i18nKey: 'issueStatusMachineTemperatureError',
        issueCategoryId: issueCategories.DeviceHealth,
        // defaultMessageTypeId: machineTemperatureErrorTypeId,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Temperature errors across machine, conduct troubleshooting.',
        ...auditFields,
      },
      SmsTemplate: {
        message:
          '{{device.name}}: Temperature errors across machine, conduct troubleshooting',
        ...auditFields,
      },

      EmailTemplate: {
        subject: '{{device.name}}: Machine Temperature Errors',
        body:
          '{{device.name}}: Temperature errors across machine, conduct troubleshooting.',
        htmlBody:
          '<em>{{device.name}}</em>: Temperature errors across machine, conduct troubleshooting.',
        ...auditFields,
      },
    },
    MachinePowerError: {
      issueType: {
        name: 'Machine Power Error',
        externalId: 'MachinePowerError',
        i18nKey: 'issueStatusMachinePowerError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Power error across machine, conduct troubleshooting',
        ...auditFields,
      },

      SmsTemplate: {
        message:
          '{{device.name}}: Power error across machine, conduct troubleshooting.',
        ...auditFields,
      },

      EmailTemplate: {
        subject: '{{device.name}}: Power error across machine',
        body:
          '{{device.name}}: Power error across machine, conduct troubleshooting.',
        htmlBody:
          '<em>{{device.name}}</em>: Power error across machine, conduct troubleshooting.',
        ...auditFields,
      },
    },
    ModuleProceduralError: {
      issueType: {
        name: 'Module Procedural Error',
        externalId: 'ModuleProceduralError',
        i18nKey: 'issueStatusModuleProceduralError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message:
          'Possible module failure on module {{issue.data.moduleName}} contact engineer',
        ...auditFields,
      },

      SmsTemplate: {
        message:
          '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
        ...auditFields,
      },

      EmailTemplate: {
        subject: '{{device.name}}: Possible module failure',
        body:
          '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
        htmlBody:
          '{{device.name}}: Possible module failure on module <em>{{issue.data.moduleName}}</em> contact engineer',
        ...auditFields,
      },
    },
    MachineProceduralError: {
      issueType: {
        name: 'Machine Procedural Error',
        externalId: 'MachineProceduralError',
        i18nKey: 'issueStatusMachineProceduralError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Procedural errors across machine, conduct troubleshooting',
        ...auditFields,
      },

      SmsTemplate: {
        message:
          '{{device.name}}: Procedural errors across machine, conduct troubleshooting',
        ...auditFields,
      },

      EmailTemplate: {
        subject: '{{device.name}}: Procedural Errors',
        body:
          '{{device.name}}: Procedural errors across machine, conduct troubleshooting.',
        htmlBody:
          '<em>{{device.name}}</em>: Procedural errors across machine, conduct troubleshooting.',
        ...auditFields,
      },
    },
    DataCategoryLowError: {
      issueType: {
        name: 'Data Category Low Error',
        externalId: 'DataCategoryLowError',
        i18nKey: 'issueStatusMachineProceduralError',
        issueCategoryId: issueCategories.DataHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message:
          '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
        ...auditFields,
      },
      SmsTemplate: {
        message:
          '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
        ...auditFields,
      },

      EmailTemplate: {
        subject: 'Low Collection Rate',
        body:
          '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
        htmlBody:
          '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
        ...auditFields,
      },
    },
    StockLevelUpdate: {
      issueType: {
        name: 'Stock Level Update',
        externalId: 'StockLevelUpdate',
        i18nKey: 'stockLevelUpdateIssue',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Recommendation,
      },
      AlertTemplate: {
        message: 'Update Stock Level',
        ...auditFields,
      },

      SmsTemplate: {
        message: '{{site.name}} - Update Stock Level',
        ...auditFields,
      },

      EmailTemplate: {
        subject: '{{site.name}} - Update Stock Level',
        body: '{{site.name}} - Update Stock Level',
        htmlBody: '{{site.name}} - Update Stock Level',
        ...auditFields,
      },
    },
    ReagentHealthError: {
      issueType: {
        name: 'Reagent Health Error',
        externalId: 'ReagentHealthError',
        i18nKey: 'reagentHealthError',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Cartridge-specific errors exceed 5%',
        ...auditFields,
      },

      SmsTemplate: {
        message: '{{device.name}} - Cartridge-specific errors exceed 5%',
        ...auditFields,
      },

      EmailTemplate: {
        subject: '{{device.name}} - Cartridge-specific errors exceed 5%',
        body: '{{device.name}} - Cartridge-specific errors exceed 5%',
        htmlBody: '{{device.name}} - Cartridge-specific errors exceed 5%',
        ...auditFields,
      },
    },
    MachineGenericError: {
      issueType: {
        name: 'Machine Generic Error',
        externalId: 'MachineGenericError',
        i18nKey: 'issueStatusMachineGenericError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },

      AlertTemplate: {
        message: 'Generic errors across machine, conduct troubleshooting',
      },

      SmsTemplate: {
        message: 'Generic errors across machine, conduct troubleshooting',
      },

      EmailTemplate: {
        subject: 'Generic Errors',
        body: 'Generic errors across machine, conduct troubleshooting',
        htmlBody: 'Generic errors across machine, conduct troubleshooting',
      },
    },
    ModuleGenericError: {
      issueType: {
        name: 'Module Generic Error',
        externalId: 'ModuleGenericError',
        i18nKey: 'issueStatusModuleGenericError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      AlertTemplate: {
        message: 'Module {{module.moduleName}} errors, conduct troubleshooting',
      },

      SmsTemplate: {
        message: 'Module {{result.moduleName}} errors, conduct troubleshooting',
      },
      EmailTemplate: {
        subject: 'Machine Temperature Errors',
        body: 'Module {{result.moduleName}} errors, conduct troubleshooting',
        htmlBody:
          'Module <em>{{result.moduleName}}</em> errors, conduct troubleshooting',
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
    },
    ModuleReplaced: {
      issueType: {
        name: 'Module Replaced',
        externalId: 'ModuleReplaced',
        i18nKey: 'issueTypeModuleReplaced',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: `{{device.name}}: Module {{issue.data.replacedModuleSerial}} in slot {{issue.data.moduleName}} has been replaced.`,
      },
      SmsTemplate: {
        message: `{{device.name}}: Module {{issue.data.replacedModuleSerial}} in slot {{issue.data.moduleName}} has been replaced.`,
      },
      EmailTemplate: {
        subject: 'Module has been replaced',
        body: `{{device.name}}: Module {{issue.data.replacedModuleSerial}} in slot {{issue.data.moduleName}} has been replaced.`,
        htmlBody: `{{device.name}}: Module {{issue.data.replacedModuleSerial}} in slot {{issue.data.moduleName}} has been replaced.`,
      },
    },
    ModuleDisabled: {
      issueType: {
        name: 'Module Disabled',
        externalId: 'ModuleDisabled',
        i18nKey: 'issueTypeModuleDisabled',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: `{{device.name}}: Module {{issue.data.moduleSerialNumber}} has been disabled on {{issue.data.disabledOn}}.`,
      },
      SmsTemplate: {
        message: `{{device.name}}: Module {{issue.data.moduleSerialNumber}} has been disabled on {{issue.data.disabledOn}}.`,
      },
      EmailTemplate: {
        subject: 'Module has been disabled',
        body: `{{device.name}}: Module {{issue.data.moduleSerialNumber}} has been disabled on {{issue.data.disabledOn}}.`,
        htmlBody: `{{device.name}}: Module {{issue.data.moduleSerialNumber}} has been disabled on {{issue.data.disabledOn}}.`,
      },
    },

    TooManyInvalidResultsModule: {
      issueType: {
        name: 'Too Many Invalid Results On Module',
        externalId: 'TooManyInvalidResultsModule',
        i18nKey: 'issueStatusTooManyInvalidResultsModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: `Too Many Invalid Results${errorIssueAlertModule}`,
        ...auditFields,
      },
      SmsTemplate: {
        message: `Too Many Invalid Results${errorIssueAlertModule}`,
        ...auditFields,
      },
      EmailTemplate: {
        subject: `Too Many Invalid Results${errorIssueAlertModule}`,
        body: `Too Many Invalid Results${errorIssueEmailModule}`,
        htmlBody: `Too Many Invalid Results${errorIssueEmailModule.replace(
          regexBreakline,
          '<br/>'
        )}`,

        ...auditFields,
      },
    },
    TooManyInvalidResultsLot: {
      issueType: {
        name: 'Too Many Invalid Results On Lot',
        externalId: 'TooManyInvalidResultsLot',
        i18nKey: 'issueStatusTooManyInvalidResultsLot',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: `Too Many Invalid Results${errorIssueAlertLot}`,
        ...auditFields,
      },
      SmsTemplate: {
        message: `Too Many Invalid Results${errorIssueAlertLot}`,
        ...auditFields,
      },
      EmailTemplate: {
        subject: `Too Many Invalid Results${errorIssueAlertLot}`,
        body: `Too Many Invalid Results${errorIssueEmailLot}`,
        htmlBody: `Too Many Invalid Results${errorIssueEmailLot.replace(
          regexBreakline,
          '<br/>'
        )}`,

        ...auditFields,
      },
    },
    ProbeCheckTooLowModule: {
      issueType: {
        name: 'Probe Check Too Low On Module',
        externalId: 'ProbeCheckTooLowModule',
        i18nKey: 'issueStatusProbeCheckTooLowModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: `Probe Check Too Low${errorIssueAlertModule}`,
        ...auditFields,
      },
      SmsTemplate: {
        message: `Probe Check Too Low${errorIssueAlertModule}`,
        ...auditFields,
      },
      EmailTemplate: {
        subject: `Probe Check Too Low${errorIssueAlertModule}`,
        body: `Probe Check Too Low${errorIssueEmailModule}`,
        htmlBody: `Probe Check Too Low${errorIssueEmailModule.replace(
          regexBreakline,
          '<br/>'
        )}`,

        ...auditFields,
      },
    },
    ProbeCheckTooLowLot: {
      issueType: {
        name: 'Probe Check Too Low On Lot',
        externalId: 'ProbeCheckTooLowLot',
        i18nKey: 'issueStatusProbesTooLow',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: `Probe Check Too Low${errorIssueAlertLot}`,
        ...auditFields,
      },
      SmsTemplate: {
        message: `Probe Check Too Low${errorIssueAlertLot}`,
        ...auditFields,
      },
      EmailTemplate: {
        subject: `Probe Check Too Low${errorIssueAlertLot}`,
        body: `Probe Check Too Low${errorIssueEmailLot}`,
        htmlBody: `Probe Check Too Low${errorIssueEmailLot.replace(
          regexBreakline,
          '<br/>'
        )}`,
        ...auditFields,
      },
    },
    ProbeCheckTooHighModule: {
      issueType: {
        name: 'Probe Check Too High On Module',
        externalId: 'ProbeCheckTooHighModule',
        i18nKey: 'issueStatusProbeCheckTooHighModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: `Probe Check Too High${errorIssueAlertModule}`,
        ...auditFields,
      },
      SmsTemplate: {
        message: `Probe Check Too High${errorIssueAlertModule}`,
        ...auditFields,
      },
      EmailTemplate: {
        subject: `Probe Check Too High${errorIssueAlertModule}`,
        body: `Probe Check Too High${errorIssueEmailModule}`,
        htmlBody: `Probe Check Too High${errorIssueEmailModule.replace(
          regexBreakline,
          '<br/>'
        )}`,

        ...auditFields,
      },
    },
    ProbeCheckTooHighLot: {
      issueType: {
        name: 'Probe Check Too High On Lot',
        externalId: 'ProbeCheckTooHighLot',
        i18nKey: 'issueStatusProbesTooHigh',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: `Probe Check Too High${errorIssueAlertLot}`,
        ...auditFields,
      },
      SmsTemplate: {
        message: `Probe Check Too High${errorIssueAlertLot}`,
        ...auditFields,
      },
      EmailTemplate: {
        subject: `Probe Check Too High${errorIssueAlertLot}`,
        body: `Probe Check Too High${errorIssueEmailLot}`,
        htmlBody: `Probe Check Too High${errorIssueEmailLot.replace(
          regexBreakline,
          '<br/>'
        )}`,
        ...auditFields,
      },
    },
    InventoryStockExpiring: {
      issueType: {
        name: 'Inventory Stock Expiring',
        externalId: 'InventoryStockExpiring',
        i18nKey: 'issueStatusInventoryStockExpiring',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: '{{issue.data.totalWasted}} consumables likely to expire.',
      },
      SmsTemplate: {
        message: '{{issue.data.totalWasted}} consumables likely to expire.',
      },
      EmailTemplate: {
        subject: 'stock expiring at {{site.name}}',
        htmlBody: '{{issue.data.totalWasted}} consumables likely to expire.',
        body: '{{issue.data.totalWasted}} consumables likely to expire.',
      },
    },
    InstrumentReplaced: {
      issueType: {
        name: 'Instrument Replaced',
        externalId: 'InstrumentReplaced',
        i18nKey: 'issueTypeInstrumentReplaced',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: msgInstrumentReplaced,
      },
      SmsTemplate: {
        message: msgInstrumentReplaced,
      },
      EmailTemplate: {
        subject: 'Instrument has been replaced',
        body: msgInstrumentReplaced,
        htmlBody: msgInstrumentReplaced,
      },
    },
  }
  return IssueDefinition
}

module.exports = {
  getBaseIssues,
}
