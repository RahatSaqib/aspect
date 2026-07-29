const { allIssueCategoryToId, allMessageSeverityToId } = require('../../src/shared/dictionary')

const getDeviceBaseHtml = ({ customPart }) => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <style>
          body {
            font-family: Arial, Sans-Serif;
          }

          table {
            width: 600px;
            border: solid 1px black;
            margin-bottom: 35px;
          }

          td {
            border: solid 1px black;
            padding: 2px;
          }
        </style>
    </head>
    <body>
      <p>
      This is an automated message from SystemOne Aspect created based on notification rules defined by Cepheid.
      </p>
      <p>
        <strong>Notification Rule</strong>
      </p>
      <table cellpadding="0" cellspacing="0">
          <tr>
              <td>
                Rule
              </td>
              <td>
                {{notification.type}}
              </td>
          </tr>
          <tr>
              <td>
                Error Code(s)
              </td>
              <td>
                {{issue.errorCode}}
              </td>
          </tr>
          <tr>
              <td>
                Occurrences
              </td>
              <td>
                {{issue.occurrences}}
              </td>
          </tr>
          <tr>
              <td>
                Time Period Days
              </td>
              <td>
                30
              </td>
          </tr>
          ${customPart}
      </table>
      <p>
        <strong>SystemOne GeneXpert System and Contact Information</strong>
      </p>
      <table cellpadding="0" cellspacing="0">
          <tr>
              <td>
                Location Name
              </td>
              <td>
                {{site.name}}
              </td>
          </tr>
          <tr>
              <td>
                Address 1
              </td>
              <td>
                {{site.street1}}
              </td>
          </tr>
          <tr>
              <td>
                Address 2
              </td>
              <td>
                {{site.street2}}
              </td>
          </tr>
          <tr>
              <td>
                State
              </td>
              <td>
                {{site.state}}
              </td>
          </tr>
          <tr>
              <td>
                Local Government Area
              </td>
              <td>
                {{site.lga}}
              </td>
          </tr>
          <tr>
              <td>
                Postal Code
              </td>
              <td>
                {{site.zip}}
              </td>
          </tr>
          <tr>
              <td>
                Country
              </td>
              <td>
                {{country.name}}
              </td>
          </tr>
          <tr>
              <td>
                Contact Name
              </td>
              <td>
                {{site.primaryContact.name}}
              </td>
          </tr>
          <tr>
              <td>
                Contact Title
              </td>
              <td>
                {{site.primaryContact.title}}
              </td>
          </tr>
          <tr>
              <td>
                Contact Phone
              </td>
              <td>
                {{site.primaryContact.phone}}
              </td>
          </tr>
          <tr>
              <td>
                Contact Cell
              </td>
              <td>
                {{site.primaryContact.cell}}
              </td>
          </tr>
          <tr>
              <td>
                Contact Email
              </td>
              <td>
                {{site.primaryContact.email}}
              </td>
          </tr>
      </table>
    </body>
</html>
`

const getDeviceBaseText = ({ customPart }) => `
This is an automated message from SystemOne Aspect created based on notification rules defined by Cepheid.
Notification Rule

Rule: {{notification.type}}

Error Code(s): {{issue.errorCode}}

Occurrences: {{issue.occurrences}}

Time Period Days: 30

${customPart}


SystemOne GeneXpert System and Contact Information

Location Name: {{site.name}}

Address 1: {{site.street1}}

Address 2: {{site.street2}}

State: {{site.state}}

Local Government Area: {{site.lga}}

Postal Code: {{site.zip}}

Country: {{country.name}}

Contact Name: {{site.primaryContact.name}}

Contact Title: {{site.primaryContact.title}}

Contact Phone: {{site.primaryContact.phone}}

Contact Cell: {{site.primaryContact.cell}}

Contact Email: {{site.primaryContact.email}}`

const errorIssueEmailHtml = getDeviceBaseHtml({
  customPart: `
  <tr>
    <td>
      System Serial
    </td>
    <td>
      {{result.instrumentSerial}}
    </td>
  </tr>
  <<REPLACE WITH MODULE OR REAGENT>>
  <tr>
    <td>
      Assay
    </td>
    <td>
      {{result.data.assay}}
    </td>
  </tr>
  <tr>
    <td>
      Assay Version
    </td>
    <td>
      {{result.data.assayVersion}}
    </td>
  </tr>
  <tr>
    <td>
      Date/Time (UTC)
    </td>
    <td>
      {{formatDate (coalesce result.endedOn result.startedOn) formatString='yyyy-MM-dd HH:mm:ss'}}
    </td>
  </tr>
`,
})

const errorIssueEmailText = getDeviceBaseText({
  customPart: `
System Serial: {{result.instrumentSerial}}

<<REPLACE WITH MODULE OR REAGENT>>

Assay: {{result.data.assay}}

Assay Version: {{result.data.assayVersion}}

Date/Time (UTC): {{formatDate (coalesce result.endedOn result.startedOn) formatString='yyyy-MM-dd HH:mm:ss'}}
`,
})

const getErrorIssueSubjectBase = errorCode => {
  const errorLabel = `Error${errorCode ? ` ${errorCode}` : ''}`
  return `Aspect Automatic Notification - Location: {{site.name}}, SN: {{result.instrumentSerial}}, ${errorLabel}: {{notification.type}}`
}
const errorIssueSubject = getErrorIssueSubjectBase()
const errorIssueEmailHtmlModule = errorIssueEmailHtml.replace(
  '<<REPLACE WITH MODULE OR REAGENT>>',
  '<tr><td>Module</td><td>{{result.moduleSerial}}</td></tr>'
)
const errorIssueEmailTextModule = errorIssueEmailText.replace(
  '<<REPLACE WITH MODULE OR REAGENT>>',
  'Module: {{result.moduleSerial}}'
)

const errorIssueEmailHtmlLot = errorIssueEmailHtml.replace(
  '<<REPLACE WITH MODULE OR REAGENT>>',
  '<tr><td>Reagent Lot</td><td>{{result.consumableLot}}</td></tr>'
)
const errorIssueEmailTextLot = errorIssueEmailText.replace(
  '<<REPLACE WITH MODULE OR REAGENT>>',
  'Reagent Lot: {{result.consumableLot}}'
)

// must correspond with 'Hardware*' items in IssueEventTrigger.json
const hardwareMessage = {
  2005: 'Syringe Stall Error',
  2008: 'Syringe Pressure Too High',
  2026: 'Ultrasonic Horn Current Out of Range',
  2032: 'Ultrasonic Horn Tuning Error',
  2035: 'Ultrasonic Horn Failure',
  2037: 'Cartridge Integrity Test Failure',
  2096: 'Assay Specific Termination Error',
  2097: 'Assay-Specific Termination #2',
  2126: 'Module was Reset',
  4008: 'Power Supply Voltage Out of Range',
  4017: 'Temperature Errors', // same as 2014 (see Excel in ASP-1831)
}
const hardwareErrorIssueEmailHtml = errorCode =>
  getDeviceBaseHtml({
    errorCode,
    customPart: `
    <tr>
      <td>
        Instrument Serials
      </td>
      <td>
        {{device.instrumentSerials}}
      </td>
    </tr>
    <tr>
      <td>
        Date/Time (UTC)
      </td>
      <td>
        {{formatDate log.startedOn formatString='yyyy-MM-dd HH:mm:ss'}}
      </td>
    </tr>
  `,
  })
const hardwareErrorIssueEmailText = errorCode =>
  getDeviceBaseText({
    errorCode,
    customPart: `
Instrument Serials: {{device.instrumentSerials}}

Date/Time (UTC): {{formatDate log.startedOn formatString='yyyy-MM-dd HH:mm:ss'}}
  `,
  })

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
        hasTag: 0,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
    },
    DeviceOffline: {
      issueType: {
        name: 'Device Offline',
        externalId: 'DeviceOffline',
        i18nKey: 'issueStatusDeviceOffline',
        issueCategoryId: issueCategories.ConnectivityHealth,
        readyForNotification: true,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Cannot reach network for {{numberOfDays device.lastPingOn}}',
        ...auditFields,
      },
      SmsTemplate: {
        message: '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
        body: '{{site.name}} cannot reach network for {{numberOfDays device.lastPingOn}}',
        htmlBody: '<em>{{site.name}}</em> cannot reach network for {{numberOfDays device.lastPingOn}}',
        ...auditFields,
      },
    },
    DeviceNoResults: {
      issueType: {
        name: 'Device No Results',
        externalId: 'DeviceNoResults',
        i18nKey: 'issueStatusDeviceNoResults',
        issueCategoryId: issueCategories.ConnectivityHealth,
        readyForNotification: true,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'No testing for {{numberOfDays issue.data.lastResultOn}}',
        ...auditFields,
      },
      SmsTemplate: {
        message: '{{device.name}} no testing for {{numberOfDays issue.data.lastResultOn}}',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: No Testing',
        body: '{{device.name}} no testing {{numberOfDays issue.data.lastResultOn}}',
        htmlBody: '<em>{{device.name}}</em> no testing for {{numberOfDays issue.data.lastResultOn}}',
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
        readyForNotification: true,
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
        message: 'Module {{issue.data.moduleName}}: Critical errors; notify R.O.',
        ...auditFields,
      },
      SmsTemplate: {
        message: 'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: Critical Module Errors',
        body: 'Module {{issue.data.moduleName}} in {{device.name}}: Critical errors; notify RO',
        htmlBody: 'Module <em>{{issue.data.moduleName}}</em> in {{device.name}}: Critical errors; notify RO',
        ...auditFields,
      },
    },
    UnusedModules: {
      issueType: {
        name: 'Unused Modules',
        externalId: 'UnusedModules',
        i18nKey: 'issueStatusUnusedModules',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Unused Module(s) in {{device.name}}',
        ...auditFields,
      },
      SmsTemplate: {
        message: 'Unused Module(s) in {{device.name}}',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: Unused module(s)',
        body: 'Unused module(s) in {{device.name}}',
        htmlBody: 'Unused module(s) in {{device.name}}',
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
        message: 'Temperature errors on Module {{issue.data.moduleName}}; notify RO',
        ...auditFields,
      },
      SmsTemplate: {
        message: '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}',
        body: '{{device.name}} has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
        htmlBody: '<em>{{device.name}}</em> has Temperature errors on Module {{issue.data.moduleName}}; notify RO.',
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
        message: '{{device.name}} has power errors on Module {{issue.data.moduleName}}; notify RO',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}} has power errors on module {{issue.data.moduleName}}',
        body: '{{device.name}} has power errors on module {{issue.data.moduleName}}; notify RO',
        htmlBody: '{{device.name}} has power errors on module <em>{{issue.data.moduleName}}</em>; notify RO',
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
        message: '{{device.name}}: Temperature errors across machine, conduct troubleshooting',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: Machine Temperature Errors',
        body: '{{device.name}}: Temperature errors across machine, conduct troubleshooting.',
        htmlBody: '<em>{{device.name}}</em>: Temperature errors across machine, conduct troubleshooting.',
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
        message: '{{device.name}}: Power error across machine, conduct troubleshooting.',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: Power error across machine',
        body: '{{device.name}}: Power error across machine, conduct troubleshooting.',
        htmlBody: '<em>{{device.name}}</em>: Power error across machine, conduct troubleshooting.',
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
        message: 'Possible module failure on module {{issue.data.moduleName}} contact engineer',
        ...auditFields,
      },

      SmsTemplate: {
        message: '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: Possible module failure',
        body: '{{device.name}}: Possible module failure on module {{issue.data.moduleName}} contact engineer',
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
        message: '{{device.name}}: Procedural errors across machine, conduct troubleshooting',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: Procedural Errors',
        body: '{{device.name}}: Procedural errors across machine, conduct troubleshooting.',
        htmlBody: '<em>{{device.name}}</em>: Procedural errors across machine, conduct troubleshooting.',
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
        message: '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
        ...auditFields,
      },
      SmsTemplate: {
        message: '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
        ...auditFields,
      },
      EmailTemplate: {
        subject: 'Low Collection Rate',
        body: '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
        htmlBody: '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
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
        htmlBody: 'Module <em>{{result.moduleName}}</em> errors, conduct troubleshooting',
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
        readyForNotification: true,
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
        readyForNotification: true,
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
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
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
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
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
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
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
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },
    FailedToVerifyValidBackgroundErrorForAnalyteModule: {
      issueType: {
        name: 'Failed To Verify Valid Background Error For Analyte On Module',
        externalId: 'FailedToVerifyValidBackgroundErrorForAnalyteModule',
        i18nKey: 'issueStatusFailedToVerifyValidBackgroundErrorForAnalyteModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    FailedToVerifyValidBackgroundErrorForAnalyteLot: {
      issueType: {
        name: 'Failed To Verify Valid Background Error For Analyte On Lot',
        externalId: 'FailedToVerifyValidBackgroundErrorForAnalyteLot',
        i18nKey: 'issueStatusFailedToVerifyValidBackgroundErrorForAnalyteLot',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },
    ProbeCheckFailedModule: {
      issueType: {
        name: 'Probe Check Failed On Module',
        externalId: 'ProbeCheckFailedModule',
        i18nKey: 'issueStatusProbeCheckFailedModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    ProbeCheckFailedLot: {
      issueType: {
        name: 'Probe Check Failed On Lot',
        externalId: 'ProbeCheckFailedLot',
        i18nKey: 'issueStatusProbeCheckFailedLot',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },
    InventoryStockExpiring: {
      issueType: {
        name: 'Inventory Stock Expiring',
        externalId: 'InventoryStockExpiring',
        i18nKey: 'issueStatusInventoryStockExpiring',
        issueCategoryId: issueCategories.ReagentHealth,
        readyForNotification: true,
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
    SignalLossDetectedInAmplificationCurveModule: {
      issueType: {
        name: 'Signal Loss Detected in the Amplification Curve On Module',
        externalId: 'SignalLossDetectedInAmplificationCurveModule',
        i18nKey: 'issueStatusSignalLossDetectedInAmplificationCurveModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    SignalLossDetectedInAmplificationCurveLot: {
      issueType: {
        name: 'Signal Loss Detected in the Amplification Curve On Lot',
        externalId: 'SignalLossDetectedInAmplificationCurveLot',
        i18nKey: 'issueStatusSignalLossDetectedInAmplificationCurveLot',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },
    CartridgeIntegrityTestFailureLot: {
      issueType: {
        name: 'Cartridge Integrity Test Failure On Lot',
        externalId: 'CartridgeIntegrityTestFailureLot',
        i18nKey: 'cartridgeIntegrityTestFailureLot',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },
    SyringePressureTooHighLot: {
      issueType: {
        name: 'Syringe Pressure Too High On Lot',
        externalId: 'SyringePressureTooHighLot',
        i18nKey: 'SyringePressureTooHighLot',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },
    SyringePressureTooHighModule: {
      issueType: {
        name: 'Syringe Pressure Too High On Module',
        externalId: 'SyringePressureTooHighModule',
        i18nKey: 'SyringePressureTooHighModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    SyringeStallErrorLot: {
      issueType: {
        name: 'Syringe Stall Error On Lot',
        externalId: 'SyringeStallErrorLot',
        i18nKey: 'SyringeStallErrorLot',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },
    UltrasonicHornFailureModule: {
      issueType: {
        name: 'Ultrasonic Horn Failure On Module',
        externalId: 'UltrasonicHornFailureModule',
        i18nKey: 'issueStatusUltrasonicHornFailureModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    UltrasonicHornTuningErrorModule: {
      issueType: {
        name: 'Ultrasonic Horn Tuning Error On Module',
        externalId: 'UltrasonicHornTuningErrorModule',
        i18nKey: 'issueStatusUltrasonicHornTuningError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    UltrasonicHornCurrentOutOfRangeModule: {
      issueType: {
        name: 'Ultrasonic Horn Current Out of Range On Module',
        externalId: 'UltrasonicHornCurrentOutOfRangeModule',
        i18nKey: 'issueStatusUltrasonicHornCurrentOutOfRangeModule',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    AssaySpecificTerminationError1Module: {
      issueType: {
        name: 'Assay Specific Termination Error On Module',
        externalId: 'AssaySpecificTerminationError1Module',
        i18nKey: 'issueStatusAssaySpecificTerminationError1Module',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    AssaySpecificTerminationError1Lot: {
      issueType: {
        name: 'Assay Specific Termination Error On Lot',
        externalId: 'AssaySpecificTerminationError1Lot',
        i18nKey: 'issueStatusAssaySpecificTerminationError1Lot',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },
    AssaySpecificTerminationError2Module: {
      issueType: {
        name: 'Assay-Specific Termination #2 On Module',
        externalId: 'AssaySpecificTerminationError2Module',
        i18nKey: 'issueStatusAssaySpecificTerminationError2Module',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextModule,
        htmlBody: errorIssueEmailHtmlModule,
        ...auditFields,
      },
    },
    AssaySpecificTerminationError2Lot: {
      issueType: {
        name: 'Assay-Specific Termination #2 On Lot',
        externalId: 'AssaySpecificTerminationError2Lot',
        i18nKey: 'issueStatusAssaySpecificTerminationError2Lot',
        issueCategoryId: issueCategories.ReagentHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: errorIssueSubject,
        body: errorIssueEmailTextLot,
        htmlBody: errorIssueEmailHtmlLot,
        ...auditFields,
      },
    },

    // --------------------------------------------------------
    // Hardware Issues - must correspond with 'Hardware*' items in IssueEventTrigger.json
    // --------------------------------------------------------
    HardwareSyringeStallError: {
      issueType: {
        name: hardwareMessage[2005],
        externalId: 'HardwareSyringeStallError',
        i18nKey: 'issueHardwareSyringeStallError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(2005),
        body: hardwareErrorIssueEmailText(2005),
        htmlBody: hardwareErrorIssueEmailHtml(2005),
        ...auditFields,
      },
    },
    HardwareSyringePressureTooHigh: {
      issueType: {
        name: hardwareMessage[2008],
        externalId: 'HardwareSyringePressureTooHigh',
        i18nKey: 'issueHardwareSyringePressureTooHigh',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(2008),
        body: hardwareErrorIssueEmailText(2008),
        htmlBody: hardwareErrorIssueEmailHtml(2008),
        ...auditFields,
      },
    },
    HardwareUltrasonicHornCurrentOutOfRange: {
      issueType: {
        name: hardwareMessage[2026],
        externalId: 'HardwareUltrasonicHornCurrentOutOfRange',
        i18nKey: 'issueHardwareUltrasonicHornCurrentOutOfRange',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(2026),
        body: hardwareErrorIssueEmailText(2026),
        htmlBody: hardwareErrorIssueEmailHtml(2026),
        ...auditFields,
      },
    },
    HardwareUltrasonicHornTuningError: {
      issueType: {
        name: hardwareMessage[2032],
        externalId: 'HardwareUltrasonicHornTuningError',
        i18nKey: 'issueHardwareUltrasonicHornTuningError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(2032),
        body: hardwareErrorIssueEmailText(2032),
        htmlBody: hardwareErrorIssueEmailHtml(2032),
        ...auditFields,
      },
    },
    HardwareUltrasonicHornFailure: {
      issueType: {
        name: hardwareMessage[2035],
        externalId: 'HardwareUltrasonicHornFailure',
        i18nKey: 'issueHardwareUltrasonicHornFailure',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(2035),
        body: hardwareErrorIssueEmailText(2035),
        htmlBody: hardwareErrorIssueEmailHtml(2035),
        ...auditFields,
      },
    },
    HardwareCartridgeIntegrityTestFailure: {
      issueType: {
        name: hardwareMessage[2037],
        externalId: 'HardwareCartridgeIntegrityTestFailure',
        i18nKey: 'issueHardwareCartridgeIntegrityTestFailure',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(2037),
        body: hardwareErrorIssueEmailText(2037),
        htmlBody: hardwareErrorIssueEmailHtml(2037),
        ...auditFields,
      },
    },
    HardwareAssaySpecificTerminationError: {
      issueType: {
        name: hardwareMessage[2096],
        externalId: 'HardwareAssaySpecificTerminationError',
        i18nKey: 'issueHardwareAssaySpecificTerminationError',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(2096),
        body: hardwareErrorIssueEmailText(2096),
        htmlBody: hardwareErrorIssueEmailHtml(2096),
        ...auditFields,
      },
    },
    HardwareAssaySpecificTerminationError2: {
      issueType: {
        name: hardwareMessage[2097],
        externalId: 'HardwareAssaySpecificTerminationError2',
        i18nKey: 'issueHardwareAssaySpecificTerminationError2',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(2097),
        body: hardwareErrorIssueEmailText(2097),
        htmlBody: hardwareErrorIssueEmailHtml(2097),
        ...auditFields,
      },
    },
    HardwareModuleWasReset: {
      issueType: {
        name: hardwareMessage[2126],
        externalId: 'HardwareModuleWasReset',
        i18nKey: 'issueHardwareModuleWasReset',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
    },
    HardwarePowerSupplyVoltageOutOfRange: {
      issueType: {
        name: hardwareMessage[4008],
        externalId: 'HardwarePowerSupplyVoltageOutOfRange',
        i18nKey: 'issueHardwarePowerSupplyVoltageOutOfRange',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(4008),
        body: hardwareErrorIssueEmailText(4008),
        htmlBody: hardwareErrorIssueEmailHtml(4008),
        ...auditFields,
      },
    },
    HardwareTemperatureErrors: {
      issueType: {
        name: hardwareMessage[4017],
        externalId: 'HardwareTemperatureErrors',
        i18nKey: 'HardwareTemperatureErrors',
        issueCategoryId: issueCategories.DeviceHealth,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      EmailTemplate: {
        subject: getErrorIssueSubjectBase(4017),
        body: hardwareErrorIssueEmailText(4017),
        htmlBody: hardwareErrorIssueEmailHtml(4017),
        ...auditFields,
      },
    },
    SiteWithLowFieldCompletionRate: {
      issueType: {
        name: 'Site with low field completion rate',
        externalId: 'SiteWithLowFieldCompletionRate',
        i18nKey: 'SiteWithLowFieldCompletionRate',
        issueCategoryId: issueCategories.DataHealth,
        readyForNotification: true,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Site with low completion rate {{site.completionRatePercentage}}%',
        ...auditFields,
      },
    },
    CalibrationDueDate: {
      issueType: {
        name: 'Calibration Due Date',
        externalId: 'CalibrationDueDate',
        i18nKey: 'CalibrationDueDate',
        issueCategoryId: issueCategories.DeviceHealth,
        readyForNotification: true,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message: 'Device Calibration due date is less than {{device.daysToCalibrationDueDate}} close',
        ...auditFields,
      },
    },
    DeviceExpectedBackOnline: {
      issueType: {
        name: 'Device Expected Back Online',
        externalId: 'DeviceExpectedBackOnline',
        i18nKey: 'issueStatusDeviceExpectedBackOnline',
        issueCategoryId: issueCategories.DeviceHealth,
        readyForNotification: true,
      },
      MessageType: {
        messageSeverityId: messageSeverities.Alert,
      },
      AlertTemplate: {
        message:
          'Device "{{device.name}}" was expected back online on {{issue.data.maintenanceDueOn}}, but is still offline.',
        ...auditFields,
      },
      SmsTemplate: {
        message:
          'Device "{{device.name}}" was expected back online on {{issue.data.maintenanceDueOn}}, but is still offline.',
        ...auditFields,
      },
      EmailTemplate: {
        subject: '{{device.name}}: No Testing',
        body: 'Device "{{device.name}}" was expected back online on {{issue.data.maintenanceDueOn}}, but is still offline.',
        htmlBody:
          'Device <em>"{{device.name}}"</em> was expected back online on {{issue.data.maintenanceDueOn}}, but is still offline.',
        ...auditFields,
      },
    },
  }
  return IssueDefinition
}

module.exports = {
  getBaseIssues,
}
