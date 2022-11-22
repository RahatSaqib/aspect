import { defineMessages } from 'react-intl'
import { resultCategory, assay, report } from '../../../messages'

export default defineMessages({
  reportBaseType: {
    id: 'pages.NotificationDetail.New.reportBaseType',
    defaultMessage: 'Reports',
  },
  hasRecurrency: {
    id: 'pages.NotificationDetail.New.hasRecurrency',
    defaultMessage: 'Has Recurrency',
  },
  ReportsAvailable: {
    id: 'pages.NotificationDetail.New.ReportsAvailable',
    defaultMessage: 'Reports Available',
  },
  issueType: {
    id: 'pages.NotificationDetail.New.issueType',
    defaultMessage: 'Issues types',
  },
  issues: {
    id: 'pages.NotificationDetail.New.issues',
    defaultMessage: 'Issues available',
  },
  titleNew: {
    id: 'pages.NotificationDetail.New.title',
    defaultMessage: 'New Notification',
  },
  titleEdit: {
    id: 'pages.NotificationDetail.Edit.title',
    defaultMessage: 'Edit Notification',
  },
  save: {
    id: 'pages.NotificationDetail.save',
    defaultMessage: 'Save',
  },
  sendToPatient: {
    id: 'pages.Notifications.sendToPatient',
    defaultMessage: 'Send to patient',
  },

  // --------------------------------------------------------------
  // Sections
  // --------------------------------------------------------------
  notificationType: {
    id: 'pages.NotificationDetail.notificationType',
    defaultMessage: 'Notification Type',
  },
  notificationTypeEnable: {
    id: 'pages.NotificationDetail.notificationTypeEnable',
    defaultMessage: 'Enable this notification',
  },
  enable: {
    id: 'pages.NotificationDetail.enable',
    defaultMessage: 'Enable',
  },
  whenResultIs: {
    id: 'pages.NotificationDetail.whenResultIs',
    defaultMessage: 'When the result is',
  },
  whenSiteIs: {
    id: 'pages.NotificationDetail.whenSiteIs',
    defaultMessage: 'When site is',
  },
  whenDeviceHasBeenOfflineForMoreThan: {
    id: 'pages.NotificationDetail.whenDeviceHasBeenOfflineForMoreThan',
    defaultMessage: 'When the device has been offline for more than ...',
  },
  daysOffline: {
    id: 'pages.NotificationDetail.daysOffline',
    defaultMessage: 'Days Offline',
  },
  whenDeviceDidNotSendResultsForMoreThan: {
    id: 'pages.NotificationDetail.whenDeviceDidNotSendResultsForMoreThan',
    defaultMessage: `When the device didn't send results for more than ...`,
  },
  daysWithoutResults: {
    id: 'pages.NotificationDetail.daysWithoutResults',
    defaultMessage: `Days without results`,
  },
  from: {
    id: 'pages.NotificationDetail.from',
    defaultMessage: 'From...',
  },
  whenDeviceHasLessThan: {
    id: 'pages.NotificationDetail.whenDeviceHasLessThan',
    defaultMessage: 'When device has less than...',
  },
  daysOfInventoryLeft: {
    id: 'pages.NotificationDetail.daysOfInventoryLeft',
    defaultMessage: 'Days of inventory left',
  },
  stockExpiring: {
    id: 'pages.NotificationDetail.stockExpiring',
    defaultMessage: 'When stock is...',
  },
  daysStockExpiring: {
    id: 'pages.NotificationDetail.stockExpiringDays',
    defaultMessage: 'Expiring in days',
  },
  send: {
    id: 'pages.NotificationDetail.send',
    defaultMessage: 'Send',
  },
  toAnyOfTheseJobFunctions: {
    id: 'pages.NotificationDetail.toAnyOfTheseJobFunctions',
    defaultMessage: 'To any of these Job Functions',
  },
  // Notification for Results
  notificationCreateGroupForResults: {
    id: 'pages.Notifications.group.forResults',
    defaultMessage: 'Notification for Results',
  },
  notificationCreateGroupForReport: {
    id: 'pages.Notifications.group.notificationCreateGroupForReport',
    defaultMessage: 'Reports Notification',
  },
  notificationTypeResultBased: {
    id: 'pages.NotificationDetail.type.ResultBased',
    defaultMessage: 'Result Based',
  },
  notificationTypeReportBased: {
    id: 'pages.NotificationDetail.type.notificationTypeReportBased',
    defaultMessage: 'Report Based',
  },
  notificationTypeIssueBased: {
    id: 'pages.NotificationDetail.type.notificationTypeIssueBased',
    defaultMessage: 'Issue Based',
  },
  // Notification for Site
  notificationCreateGroupForSite: {
    id: 'pages.Notifications.group.forSite',
    defaultMessage: 'Notification for Site',
  },
  notificationTypeLowInventory: {
    id: 'pages.Notification.type.LowInventory',
    defaultMessage: 'Low Inventory',
  },
  notificationTypeExpiring: {
    id: 'pages.Notification.type.InventoryExpiring',
    defaultMessage: 'Inventory Expiring',
  },
  // Notification for Devices
  notificationCreateGroupForDevices: {
    id: 'pages.Notifications.group.forDevices',
    defaultMessage: 'Notification for Devices',
  },
  notificationTypeNoResult: {
    id: 'pages.NotificationDetail.type.NoResult',
    defaultMessage: 'No Result',
  },
  notificationTypeOffline: {
    id: 'pages.Notification.type.Offline',
    defaultMessage: 'Offline',
  },
  notificationTypeCalibration: {
    id: 'pages.Notification.type.Calibration',
    defaultMessage: 'Calibration',
  },
  notificationTypeModuleReplaced: {
    id: 'pages.Notification.type.ModuleReplaced',
    defaultMessage: 'Module Replaced',
  },
  notificationTypeModuleDisabled: {
    id: 'pages.Notification.type.ModuleDisabled',
    defaultMessage: 'Module Disabled',
  },
  notificationTypeModuleUnused: {
    id: 'pages.Notification.type.ModuleUnused',
    defaultMessage: 'Module Unused',
  },
  notificationTypeInstrumentReplaced: {
    id: 'pages.Notification.type.InstrumentReplaced',
    defaultMessage: 'Instrument Replaced',
  },
  notificationTypeReport: {
    id: 'pages.Notification.type.Report',
    defaultMessage: 'Report',
  },
  notificationTypeModule: {
    id: 'pages.Notification.type.Module',
    defaultMessage: 'Module',
  },
  notificationTypeCriticalError: {
    id: 'pages.Notification.type.CriticalError',
    defaultMessage: 'Critical Error',
  },
  notificationTypeOnlineDate: {
    id: 'pages.Notification.type.OnlineDate',
    defaultMessage: 'Online Date',
  },
  // --------------------------------------------------------------
  notificationTitle: {
    id: 'pages.NotificationDetail.notificationTitle',
    defaultMessage: 'Notification Title',
  },
  // --------------------------------------------------------------
  // section "When site is"
  // --------------------------------------------------------------
  siteTitle: {
    id: 'pages.NotificationDetail.siteTitle',
    defaultMessage: 'Site',
  },
  sitePlaceholder: {
    id: 'pages.NotificationDetail.sitePlaceholder',
    defaultMessage: 'Select Site...',
  },

  // --------------------------------------------------------------
  // section "When the result is"
  // --------------------------------------------------------------
  assayTitle: {
    id: 'pages.NotificationDetail.assayTitle',
    defaultMessage: 'Assay',
  },
  assayPlaceholder: {
    id: 'pages.NotificationDetail.assayPlaceholder',
    defaultMessage: 'Select Assay ...',
  },
  resultTitle: {
    id: 'pages.NotificationDetail.resultTitle',
    defaultMessage: 'Result',
  },
  resultPlaceholder: {
    id: 'pages.NotificationDetail.resultPlaceholder',
    defaultMessage: 'Select Result Category ...',
  },

  // --------------------------------------------------------------
  // section "From this device"
  // --------------------------------------------------------------
  //  Device Area Level
  SelectAreaTitle: {
    id: 'pages.NotificationDetail.SelectAreaTitle',
    defaultMessage: 'Device Area Level',
  },
  SelectAreaPlaceholder: {
    id: 'pages.NotificationDetail.SelectAreaPlaceholder',
    defaultMessage: 'Choose Device Level ...',
  },
  AreaNational: {
    id: 'pages.NotificationDetail.Area.National',
    defaultMessage: 'National',
  },
  AreaState: {
    id: 'pages.NotificationDetail.Area.State',
    defaultMessage: 'State',
  },
  AreaLGA: {
    id: 'pages.NotificationDetail.Area.LGA',
    defaultMessage: 'LGA',
  },
  AreaLaboratory: {
    id: 'pages.NotificationDetail.Area.Laboratory',
    defaultMessage: 'Laboratory',
  },
  SelectLevel: {
    id: 'pages.NotificationDetail.SelectLevel',
    defaultMessage: 'Select Level',
  },

  // device area items
  SelectNationalTitle: {
    id: 'pages.NotificationDetail.SelectNationalTitle',
    defaultMessage: 'Device Country',
  },
  SelectStateTitle: {
    id: 'pages.NotificationDetail.SelectStateTitle',
    defaultMessage: 'Device from State',
  },
  SelectLgaTitle: {
    id: 'pages.NotificationDetail.SelectLgaTitle',
    defaultMessage: 'Devices from LGA',
  },
  SelectLabTitle: {
    id: 'pages.NotificationDetail.SelectLabTitle',
    defaultMessage: 'Devices from Lab',
  },
  SelectNationalPlaceholder: {
    id: 'pages.NotificationDetail.SelectNationalPlaceholder',
    defaultMessage: 'Choose Country ...',
  },
  SelectStatePlaceholder: {
    id: 'pages.NotificationDetail.SelectStatePlaceholder',
    defaultMessage: 'Choose States ...',
  },
  SelectLgaPlaceholder: {
    id: 'pages.NotificationDetail.SelectLgaPlaceholder',
    defaultMessage: `Choose LGA's ...`,
  },
  SelectLabPlaceholder: {
    id: 'pages.NotificationDetail.SelectLabPlaceholder',
    defaultMessage: 'Choose Labs ...',
  },

  // --------------------------------------------------------------
  // section "Send"
  // --------------------------------------------------------------
  email: {
    id: 'pages.NotificationDetail.email',
    defaultMessage: 'Email',
  },
  emailSubject: {
    id: 'pages.NotificationDetail.emailSubject',
    defaultMessage: 'Email Subject',
  },
  emailBody: {
    id: 'pages.NotificationDetail.emailBody',
    defaultMessage: 'Email Body',
  },
  sms: {
    id: 'pages.NotificationDetail.sms',
    defaultMessage: 'SMS',
  },
  smsBody: {
    id: 'pages.NotificationDetail.smsBody',
    defaultMessage: 'SMS Body',
  },
  smsBodyLimit: {
    id: 'pages.NotificationDetail.smsBodyLimit',
    defaultMessage: 'Sms message should not be longer than 144 characters',
  },
  web: {
    id: 'pages.NotificationDetail.web',
    defaultMessage: 'Web',
  },
  webUrl: {
    id: 'pages.NotificationDetail.webUrl',
    defaultMessage: 'Web Url',
  },
  webUrlInvalid: {
    id: 'pages.NotificationDetail.webUrlInvalid',
    defaultMessage: 'Please enter a valid url',
  },
  webBody: {
    id: 'pages.NotificationDetail.webBody',
    defaultMessage: 'Web Body',
  },
  required: {
    id: 'forms.required',
    defaultMessage: 'Required',
  },

  // --------------------------------------------------------------
  // section "To any of these contacts"
  // --------------------------------------------------------------
  toNationalContacts: {
    id: 'pages.NotificationDetail.toNationalContacts',
    defaultMessage: 'National Contacts',
  },
  jobFunctionTags: {
    id: 'pages.NotificationDetail.jobFunctionTags',
    defaultMessage: 'Select contacts with any of the following tags',
  },
  jobFunctionAtLeastOneNeeded: {
    id: 'pages.NotificationDetail.jobFunctionAtLeastOneNeeded',
    defaultMessage: 'Please select at least one Job Function',
  },
  toStateContacts: {
    id: 'pages.NotificationDetail.toStateContacts',
    defaultMessage: 'State Contacts',
  },
  toLgaContacts: {
    id: 'pages.NotificationDetail.toLgaContacts',
    defaultMessage: 'LGA Contacts',
  },
  toLaboratoryContacts: {
    id: 'pages.NotificationDetail.toLabContacts',
    defaultMessage: 'Laboratory Contacts',
  },

  // --------------------------------------------------------------
  site: {
    id: 'forms.formSectionHeader.site',
    defaultMessage: 'Site',
  },
  device: {
    id: 'forms.formSectionHeader.device',
    defaultMessage: 'Device',
  },

  date: {
    id: 'forms.formSectionHeader.date',
    defaultMessage: 'Date',
  },
  sample: {
    id: 'forms.formSectionHeader.sample',
    defaultMessage: 'Sample',
  },
  patient: {
    id: 'forms.formSectionHeader.patient',
    defaultMessage: 'Patient',
  },
  technicalDetails: {
    id: 'forms.formSectionHeader.technicalDetails',
    defaultMessage: 'Technical Details',
  },

  transferResult: {
    id: 'pages.resultEdit.transferResult',
    defaultMessage: 'Transfer Result',
  },
  header: {
    id: 'pages.transferResult.header',
    defaultMessage: 'Transfer Result',
  },
  titleSites: {
    id: 'pages.transferResult.titleSites',
    defaultMessage: 'Transfer to Clinic',
  },
  hint: {
    id: 'pages.transferResult.hint',
    defaultMessage: 'Enter clinic name',
  },
  enterComment: {
    id: 'pages.transferResult.enterComment',
    defaultMessage: 'Enter a comment',
  },
  buttonCancel: {
    id: 'pages.transferResult.buttonCancel',
    defaultMessage: 'Cancel',
  },
  buttonTransfer: {
    id: 'pages.transferResult.buttonTransfer',
    defaultMessage: 'Transfer',
  },
  includeAllResults: {
    id: 'pages.transferResult.includeAllResults',
    defaultMessage: 'Include ALL results related to Patient ID',
  },
  processing: {
    id: 'pages.transferResult.processing',
    defaultMessage: 'Processing ...',
  },
  note: {
    id: 'pages.transferResult.note',
    defaultMessage: `
      Please notice that above field 'Transfer to Clinic' lists all clinics, even those
      which you may not have access to.
      In a such case - by transferring this result you won't
      be able to edit this result record any more, and your
      action cannot be undone.
    `,
  },
  successOk: {
    id: 'pages.transferResult.successOk',
    defaultMessage: `OK`,
  },
  successHeader: {
    id: 'pages.transferResult.successHeader',
    defaultMessage: `
      Result Transfer Completed
    `,
  },
  successMessagePatient: {
    id: 'pages.transferResult.successMessagePatient',
    defaultMessage: 'Result for patient "{patientId}" has been transferred from "{oldSiteName}" to "{newSiteName}"',
  },
  successMessageButton: {
    id: 'pages.transferResult.successMessageButton',
    defaultMessage: 'After clicking the OK button below, you will be redirected to the list of results.',
  },

  // --------------------------------------------------------------
  fieldName: {
    id: 'pages.NotificationDetail.fieldName',
    defaultMessage: 'Name',
  },
  fieldShortName: {
    id: 'pages.NotificationDetail.fieldShortName',
    defaultMessage: 'ShortName',
  },
  fieldFacilityCode: {
    id: 'pages.NotificationDetail.fieldFacilityCode',
    defaultMessage: 'Facility Code',
  },
  fieldExternalId: {
    id: 'pages.NotificationDetail.fieldExternalId',
    defaultMessage: 'Site ID',
  },
  fieldTimeZone: {
    id: 'pages.NotificationDetail.fieldTimeZone',
    defaultMessage: 'Time Zone',
  },
  fieldState: {
    id: 'pages.NotificationDetail.fieldState',
    defaultMessage: 'State',
  },
  fieldCountry: {
    id: 'pages.NotificationDetail.fieldCountry',
    defaultMessage: 'Country',
  },
  fieldLGA: {
    id: 'pages.NotificationDetail.fieldLGA',
    defaultMessage: 'LGA',
  },
  fieldAddress: {
    id: 'pages.NotificationDetail.fieldAddress',
    defaultMessage: 'Address',
  },
  fieldAddress2: {
    id: 'pages.NotificationDetail.fieldAddress2',
    defaultMessage: 'Address 2',
  },
  fieldCity: {
    id: 'pages.NotificationDetail.fieldCity',
    defaultMessage: 'City',
  },
  fieldZip: {
    id: 'pages.NotificationDetail.fieldZip',
    defaultMessage: 'Zip',
  },
  fieldLongitude: {
    id: 'pages.NotificationDetail.fieldLongitude',
    defaultMessage: 'Longitude',
  },
  fieldLatitude: {
    id: 'pages.NotificationDetail.fieldLatitude',
    defaultMessage: 'Latitude',
  },
  fieldTags: {
    id: 'pages.NotificationDetail.fieldTags',
    defaultMessage: 'Tags',
  },
  fieldDevices: {
    id: 'pages.NotificationDetail.fieldDevices',
    defaultMessage: 'Devices',
  },
  fieldContact: {
    id: 'pages.NotificationDetail.fieldContact',
    defaultMessage: 'Site Contacts',
  },
  buttonSetBasedonAddress: {
    id: 'pages.NotificationDetail.buttonSetBasedonAddress',
    defaultMessage: 'Set based on address',
  },
  buttonUpdate: {
    id: 'pages.NotificationDetail.buttonUpdate',
    defaultMessage: 'UPDATE',
  },
  fieldNoContact: {
    id: 'pages.NotificationDetail.fieldNoContact',
    defaultMessage: 'No contacts assigned to site',
  },
  fieldNoMatch: {
    id: 'pages.NotificationDetail.fieldNoMatch',
    defaultMessage: 'No matching results found',
  },
  fieldNoMatchTags: {
    id: 'pages.NotificationDetail.fieldNoMatchTags',
    defaultMessage: 'Press enter to add tag',
  },
  fieldPersonSendToSpecific: {
    id: 'pages.Notifications.fieldPersonSendToSpecific',
    defaultMessage: 'Send to a specific person',
  },
  optionPersonRoleSet: {
    id: 'pages.Notifications.optionPersonRoleSet',
    defaultMessage: 'Selectable',
  },
  optionPersonRoleNotSet: {
    id: 'pages.Notifications.optionPersonRoleNotSet',
    defaultMessage: 'Currently not selectable - missing role',
  },
  personsSelectLabel: {
    id: 'pages.NotificationDetail.personsSelectLabel',
    defaultMessage: 'To an individual person',
  },
  selectPersonOption: {
    id: 'pages.NotificationDetail.selectPersonOption',
    defaultMessage: 'Select the person or persons',
  },
  actionAdd: {
    id: 'pages.NotificationDetail.actionAdd',
    defaultMessage: 'Add',
  },
  actionUpdate: {
    id: 'pages.NotificationDetail.actionUpdate',
    defaultMessage: 'Update',
  },
  actionChange: {
    id: 'pages.NotificationDetail.actionChange',
    defaultMessage: 'Change',
  },

  dataDateRange: {
    id: 'pages.Notifications.dataDateRange',
    defaultMessage: 'Date Range',
  },
  dataDateRangeTitle: {
    id: 'pages.Notifications.dataDateRangeTitle',
    defaultMessage: 'Define date range for report',
  },

  ...assay,
  ...resultCategory,
  ...report,
})
