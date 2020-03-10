const {
  allIssueCategoryToId,
  allMessageSeverityToId,
} = require('../../src/shared/dictionary')

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
        // defaultMessageTypeId: deviceOfflineMessageTypeId,
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
        // defaultMessageTypeId: deviceNoResultsMessageTypeId,
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
        // defaultMessageTypeId: modulePowerErrorTypeId,
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
        // defaultMessageTypeId: machinePowerErrorTypeId,
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
        // defaultMessageTypeId: machineProceduralErrorTypeId,
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
        // defaultMessageTypeId: dataCategoryLowTypeId,
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
        // defaultMessageTypeId: stockLevelUpdateTypeId,
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
        // defaultMessageTypeId: reagentHealthTypeId,
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
    },
  }
  return IssueDefinition
}

module.exports = {
  getBaseIssues,
}
