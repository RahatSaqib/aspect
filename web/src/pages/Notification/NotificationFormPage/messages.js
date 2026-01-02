import { defineMessages } from 'react-intl'
import form from '../../../components/Form/messages'
import { assay, report, resultCategory } from '../../../messages'

const result = defineMessages({
  gxEbolaGPDetectedNPDetected: {
    id: 'pages.filters.gxEbolaGPDetectedNPDetected',
    defaultMessage: 'GP Detected - NP Detected',
  },
  gxEbolaGPDetected: {
    id: 'pages.filters.gxEbolaGPDetected',
    defaultMessage: 'GP Detected',
  },
  gxEbolaNPDetected: {
    id: 'pages.filters.gxEbolaNPDetected',
    defaultMessage: 'NP Detected',
  },
  gxEbolaGPNotDetectedNPNotDetected: {
    id: 'pages.filters.gxEbolaGPNotDetectedNPNotDetected',
    defaultMessage: 'GP Not Detected - NP Not Detected',
  },
  gxEbolaGPNotDetectedNPDetected: {
    id: 'pages.filters.gxEbolaGPNotDetectedNPDetected',
    defaultMessage: 'GP Not Detected - NP Detected',
  },
  gxEbolaGPDetectedNPNotDetected: {
    id: 'pages.filters.gxEbolaGPDetectedNPNotDetected',
    defaultMessage: 'GP Detected - NP Not Detected',
  },
  gxEbolaGPInvalid: {
    id: 'pages.filters.gxEbolaGPInvalid',
    defaultMessage: 'GP Invalid',
  },
  gxEbolaGPError: {
    id: 'pages.filters.gxEbolaGPError',
    defaultMessage: 'Error',
  },
  gxEbolaGPNoResult: {
    id: 'pages.filters.gxEbolaGPNoResult',
    defaultMessage: 'GP No Result',
  },
  gxMtbRifMtbNotDetected: {
    id: 'pages.filters.gxMtbRifMtbNotDetected',
    defaultMessage: 'MTB Not Detected',
  },
  gxMtbRifMtbDetected: {
    id: 'pages.filters.gxMtbRifMtbDetected',
    defaultMessage: 'MTB Detected',
  },
  gxMtbRifMtbDetectedRifDetected: {
    id: 'pages.filters.gxMtbRifMtbDetectedRifDetected',
    defaultMessage: 'MTB Detected RIF Detected',
  },
  gxMtbRifMtbDetectedRifNotDetected: {
    id: 'pages.filters.gxMtbRifMtbDetectedRifNotDetected',
    defaultMessage: 'MTB Detected RIF Not Detected',
  },
  gxMtbRifMtbDetectedRifIndeterminate: {
    id: 'pages.filters.gxMtbRifMtbDetectedRifIndeterminate',
    defaultMessage: 'MTB Detected RIF Indeterminate',
  },
  gxMtbRifMtbInvalid: {
    id: 'pages.filters.gxMtbRifMtbInvalid',
    defaultMessage: 'MTB Invalid',
  },
  gxMtbRifMtbError: {
    id: 'pages.filters.gxMtbRifMtbError',
    defaultMessage: 'MTB Error',
  },
  gxMtbRifMtbNoResult: {
    id: 'pages.filters.gxMtbRifMtbNoResult',
    defaultMessage: 'MTB No Result',
  },
  gxMtbRifUltraMtbNotDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbNotDetected',
    defaultMessage: 'MTB Not Detected',
  },
  gxMtbRifUltraMtbTraceDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbTraceDetected',
    defaultMessage: 'MTB Trace Detected',
  },
  gxMtbRifUltraMtbDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbDetected',
    defaultMessage: 'MTB Detected',
  },
  gxMtbRifUltraMtbDetectedRifNotDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbDetectedRifNotDetected',
    defaultMessage: 'MTB Detected - Rif Not Detected',
  },
  gxMtbRifUltraMtbDetectedRifDetected: {
    id: 'pages.filters.gxMtbRifUltraMtbDetectedRifDetected',
    defaultMessage: 'MTB Detected - Rif Detected',
  },
  gxMtbRifUltraMtbDetectedRifIndeterminate: {
    id: 'pages.filters.gxMtbRifUltraMtbDetectedRifIndeterminate',
    defaultMessage: 'MTB Detected - Rif Indeterminate',
  },
  gxMtbRifUltraMtbInvalid: {
    id: 'pages.filters.gxMtbRifUltraMtbInvalid',
    defaultMessage: 'MTB Invalid',
  },
  gxMtbRifUltraMtbError: {
    id: 'pages.filters.gxMtbRifUltraMtbError',
    defaultMessage: 'MTB Error',
  },
  gxMtbRifUltraMtbNoResult: {
    id: 'pages.filters.gxMtbRifUltraMtbNoResult',
    defaultMessage: 'MTB No Result',
  },
  GxMtbRifUltraMTBTraceDetectedRifIndeterminate: {
    id: 'pages.filters.GxMtbRifUltraMTBTraceDetectedRifIndeterminate',
    defaultMessage: 'MTB Trace Detected Rif Indeterminate',
  },
  GxMtbRifUltraMTBTraceDetectedRifNoResult: {
    id: 'pages.filters.GxMtbRifUltraMTBTraceDetectedRifNoResult',
    defaultMessage: 'MTB Trace Detected Rif No Result',
  },
  gxMtbXdrMtbNotDetected: {
    id: 'pages.filters.gxMtbXdrMtbNotDetected',
    defaultMessage: 'MTB Not Detected',
  },
  gxMtbXdrMtbDetected: {
    id: 'pages.filters.gxMtbXdrMtbDetected',
    defaultMessage: 'MTB Detected',
  },
  gxMtbXdrMtbDetectedXdrDetected: {
    id: 'pages.filters.gxMtbXdrMtbDetectedXdrDetected',
    defaultMessage: 'MTB Detected Drug Resistance Detected',
  },
  gxMtbXdrMtbDetectedXdrNotDetected: {
    id: 'pages.filters.gxMtbXdrMtbDetectedXdrNotDetected',
    defaultMessage: 'MTB Detected Drug Resistance Not Detected',
  },
  gxMtbXdrMtbDetectedXdrIndeterminate: {
    id: 'pages.filters.gxMtbXdrMtbDetectedXdrIndeterminate',
    defaultMessage: 'MTB Detected Drug Resistance Indeterminate',
  },
  gxMtbXdrMtbInvalid: {
    id: 'pages.filters.gxMtbXdrMtbInvalid',
    defaultMessage: 'MTB Invalid',
  },
  gxMtbXdrMtbError: {
    id: 'pages.filters.gxMtbXdrMtbError',
    defaultMessage: 'MTB Error',
  },
  gxMtbXdrMtbNoResult: {
    id: 'pages.filters.gxMtbXdrMtbNoResult',
    defaultMessage: 'MTB No Result',
  },
  GxMtbXdrMTBNotDetectedDrugResistanceNotDetected: {
    id: 'pages.filters.GxMtbXdrMTBNotDetectedDrugResistanceNotDetected',
    defaultMessage: 'MTB Not Detected Drug Resistance Not Detected',
  },
  assayGenericDstresultCategoryPositiveMTBresultCategorySusceptible: {
    id: 'assayGenericDstresultCategoryPositiveMTBresultCategorySusceptible',
    defaultMessage: 'MTB Positive MTB Resistance Susceptible',
  },
  assayGenericDstresultCategorySuccessresultCategorySusceptible: {
    id: 'assayGenericDstresultCategorySuccessresultCategorySusceptible',
    defaultMessage: 'MTB Success Resistance Susceptible',
  },
  assayGenericDstResultCategoryDetectedresultCategorySusceptible: {
    id: 'assayGenericDstResultCategoryDetectedresultCategorySusceptible',
    defaultMessage: 'MTB Detected Resistance Susceptible',
  },
  assayGenericDstresultCategoryPositiveMTBresultCategoryResistant: {
    id: 'assayGenericDstresultCategoryPositiveMTBresultCategoryResistant',
    defaultMessage: 'MTB Positive MTB Resistance Resistant',
  },
  assayGenericDstresultCategorySuccessresultCategoryResistant: {
    id: 'assayGenericDstresultCategorySuccessresultCategoryResistant',
    defaultMessage: 'MTB Success Resistance Resistant',
  },
  assayGenericDstResultCategoryDetectedresultCategoryResistant: {
    id: 'assayGenericDstResultCategoryDetectedresultCategoryResistant',
    defaultMessage: 'MTB Detected Resistance Resistant',
  },
  assayGenericDstResultCategoryDetected: {
    id: 'assayGenericDstResultCategoryDetected',
    defaultMessage: 'MTB Detected',
  },
  assayGenericDstresultCategoryNotDetected: {
    id: 'assayGenericDstresultCategoryNotDetected',
    defaultMessage: 'MTB Not Detected',
  },
  assayGenericDstresultCategoryInvalid: { id: 'assayGenericDstresultCategoryInvalid', defaultMessage: 'MTB Invalid' },
  assayGenericDstresultCategoryError: { id: 'assayGenericDstresultCategoryError', defaultMessage: 'MTB Error' },
  assayGenericDstresultCategorySuccess: { id: 'assayGenericDstresultCategorySuccess', defaultMessage: 'MTB Success' },
  assayGenericDstresultCategoryMissing: { id: 'assayGenericDstresultCategoryMissing', defaultMessage: 'MTB Missing' },
  assayGenericDstresultCategoryUnknown: { id: 'assayGenericDstresultCategoryUnknown', defaultMessage: 'MTB Unknown' },
  assayGenericDstresultCategoryContaminated: {
    id: 'assayGenericDstresultCategoryContaminated',
    defaultMessage: 'MTB Contaminated',
  },
  assayGenericDstresultCategoryPositiveMOTT: {
    id: 'assayGenericDstresultCategoryPositiveMOTT',
    defaultMessage: 'MTB Positive MOTT',
  },
  assayGenericDstresultCategoryPositiveMTB: {
    id: 'assayGenericDstresultCategoryPositiveMTB',
    defaultMessage: 'MTB Positive MTB',
  },
  assayGenericCultureResultCategoryDetected: {
    id: 'assayGenericCultureResultCategoryDetected',
    defaultMessage: 'Culture Result Detected',
  },
  assayGenericCultureresultCategoryNotDetected: {
    id: 'assayGenericCultureresultCategoryNotDetected',
    defaultMessage: 'Culture Result Not Detected',
  },
  assayGenericCultureresultCategoryInvalid: {
    id: 'assayGenericCultureresultCategoryInvalid',
    defaultMessage: 'Culture Result Invalid',
  },
  assayGenericCultureresultCategoryError: {
    id: 'assayGenericCultureresultCategoryError',
    defaultMessage: 'Culture Result Error',
  },
  assayGenericCultureresultCategorySuccess: {
    id: 'assayGenericCultureresultCategorySuccess',
    defaultMessage: 'Culture Result Success',
  },
  assayGenericCultureresultCategoryMissing: {
    id: 'assayGenericCultureresultCategoryMissing',
    defaultMessage: 'Culture Result Missing',
  },
  assayGenericCultureresultCategoryUnknown: {
    id: 'assayGenericCultureresultCategoryUnknown',
    defaultMessage: 'Culture Result Unknown',
  },
  assayGenericCultureresultCategoryContaminated: {
    id: 'assayGenericCultureresultCategoryContaminated',
    defaultMessage: 'Culture Result Contaminated',
  },
  assayGenericCultureresultCategoryPositiveMOTT: {
    id: 'assayGenericCultureresultCategoryPositiveMOTT',
    defaultMessage: 'Culture Result Positive MOTT',
  },
  assayGenericCultureresultCategoryPositiveMTB: {
    id: 'assayGenericCultureresultCategoryPositiveMTB',
    defaultMessage: 'Culture Result Positive MTB',
  },
  assayLPAresultCategoryPositiveMTBresultCategorySusceptible: {
    id: 'assayLPAresultCategoryPositiveMTBresultCategorySusceptible',
    defaultMessage: 'MTB Positive MTB Resistance Susceptible',
  },
  assayLPAresultCategoryPositiveMTBresultCategoryResistant: {
    id: 'assayLPAresultCategoryPositiveMTBresultCategoryResistant',
    defaultMessage: 'MTB Positive MTB Resistance Resistant',
  },
  assayLPAresultCategoryNotDetected: { id: 'assayLPAresultCategoryNotDetected', defaultMessage: 'MTB Not Detected' },
  assayLPAresultCategoryInvalid: { id: 'assayLPAresultCategoryInvalid', defaultMessage: 'MTB Invalid' },
  assayLPAresultCategoryMissing: { id: 'assayLPAresultCategoryMissing', defaultMessage: 'MTB Missing' },
  assayLPAresultCategoryUnknown: { id: 'assayLPAresultCategoryUnknown', defaultMessage: 'MTB Unknown' },
  assayLPAresultCategoryPositiveMTB: { id: 'assayLPAresultCategoryPositiveMTB', defaultMessage: 'MTB Positive MTB' },
  assaySmearResultCategoryDetected: { id: 'assaySmearResultCategoryDetected', defaultMessage: 'Smear Result Detected' },
  assaySmearresultCategoryNotDetected: {
    id: 'assaySmearresultCategoryNotDetected',
    defaultMessage: 'Smear Result Not Detected',
  },
  assaySmearresultCategoryInvalid: { id: 'assaySmearresultCategoryInvalid', defaultMessage: 'Smear Result Invalid' },
  assaySmearresultCategoryMissing: { id: 'assaySmearresultCategoryMissing', defaultMessage: 'Smear Result Missing' },
  assaySmearresultCategoryUnknown: { id: 'assaySmearresultCategoryUnknown', defaultMessage: 'Smear Result Unknown' },
  assaySmearresultCategoryPositive1: {
    id: 'assaySmearresultCategoryPositive1',
    defaultMessage: 'Smear Result Positive (+)',
  },
  assaySmearresultCategoryPositive2: {
    id: 'assaySmearresultCategoryPositive2',
    defaultMessage: 'Smear Result Positive (++)',
  },
  assaySmearresultCategoryPositive3: {
    id: 'assaySmearresultCategoryPositive3',
    defaultMessage: 'Smear Result Positive (+++)',
  },
})

export default defineMessages({
  yes: {
    id: 'pages.NotificationDetail.New.yes',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'pages.NotificationDetail.New.no',
    defaultMessage: 'No',
  },
  buildNotification: {
    id: 'pages.NotificationDetail.New.buildNotification',
    defaultMessage: 'Build Notification',
  },
  editNotification: {
    id: 'pages.NotificationDetail.New.editNotification',
    defaultMessage: 'Edit Notification',
  },
  previewNotification: {
    id: 'pages.NotificationDetail.New.previewNotification',
    defaultMessage: 'Preview Notification',
  },
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
  whenDeviceHasBeenInactiveForMoreThan: {
    id: 'pages.NotificationDetail.whenDeviceHasBeenInactiveForMoreThan',
    defaultMessage: 'When the device has been inactive for more than ...',
  },
  repeatCheckAndNotifyInactive: {
    id: 'pages.NotificationDetail.repeatCheckAndNotifyInactive',
    defaultMessage: 'Number of times to repeat check and notify if inactive ...',
  },
  daysInactive: {
    id: 'pages.NotificationDetail.daysInactive',
    defaultMessage: 'Days',
  },
  recurrenceFactor: {
    id: 'pages.NotificationDetail.recurrenceFactor',
    defaultMessage: 'Times',
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
  notificationTypeLowFieldCompletionRate: {
    id: 'pages.Notification.type.LowFieldCompletionRate',
    defaultMessage: 'Low Field Completion Rate',
  },
  notificationTypeLowFieldCompletionRateMessage: {
    id: 'pages.Notification.type.LowFieldCompletionRateMessage',
    defaultMessage:
      'This notification will be triggered any time a site changes its custom fields completion rate to less than 0.8. Also, it will be sent only if you have the custom field completion weight set in your country. Please check with your administrator before using it.',
  },
  notificationTypeResultBasedMessage: {
    id: 'pages.Notification.type.notificationTypeResultBasedMessage',
    defaultMessage: `The result based notification can be sent on test creation or on test creation and update. Also, a test is only going to trigger a notification if it is less than {daysLimitToNotifyResults} days old, it was done before the last update of this notification, and if any of the next conditions are accomplished:\n
      - All the custom fields referenced in the templates of the notification were filled in the test\n
      - {hoursNotificationsShouldWaitForCustomFields} hours passed since the test was done
      `,
  },
  notificationTypeDeviceOffline: {
    id: 'pages.Notification.type.notificationTypeDeviceOffline',
    defaultMessage:
      'This notification will trigger once a device connector, for example GxConnect, remains offline for 7 days.',
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
  notificationTypeDeviceExpectedBackOnline: {
    id: 'pages.NotificationDetail.type.DeviceExpectedBackOnline',
    defaultMessage: 'Expected Back Online',
  },
  notificationTypeOffline: {
    id: 'pages.Notification.type.Inactive',
    defaultMessage: 'Device Inactive',
  },
  notificationTypeCalibration: {
    id: 'pages.Notification.type.Calibration',
    defaultMessage: 'Calibration Due Date',
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
  triggerConditionTitle: {
    id: 'pages.Notifications.triggerConditionTitle',
    defaultMessage: 'Trigger this notification when...',
  },
  triggerWhenForResultCreated: {
    id: 'pages.Notifications.triggerWhenForResultCreated',
    defaultMessage: 'Result is Created',
  },
  triggerWhenForResultUpdated: {
    id: 'pages.Notifications.triggerWhenForResultUpdated',
    defaultMessage: 'Result is Updated',
  },
  triggerWhenResultCreatedOrUpdated: {
    id: 'pages.Notifications.triggerWhenResultCreatedOrUpdated',
    defaultMessage: 'Result is Created or Updated',
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
    defaultMessage: 'Sms message should not be longer than 2000 characters',
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
  startingDayOfTheWeekTitle: {
    id: 'pages.Notifications.startingDayOfTheWeekTitle',
    defaultMessage: 'Starting Day of the Week',
  },
  protectWithPassword: {
    id: 'pages.Notifications.protectWithPassword',
    defaultMessage: 'Protect report file with this password',
  },
  setting: {
    id: 'pages.Notifications.setting',
    defaultMessage: 'Setting',
  },
  password: {
    id: 'pages.Notifications.password',
    defaultMessage: 'Password',
  },

  // Calibration section
  calibrationDays: {
    id: 'pages.Notifications.calibrationDays',
    defaultMessage: 'Days...',
  },
  daysBeforeCalibrationDueDate: {
    id: 'pages.Notifications.daysBeforeCalibrationDueDate',
    defaultMessage: 'Before Calibration Due Date',
  },
  GxUnknown: {
    id: 'pages.ResultList.GxUnknown',
    defaultMessage: 'GeneXpert Unknown',
  },
  GxHcv: {
    id: 'pages.ResultList.GxHcv',
    defaultMessage: 'GeneXpert HCV',
  },
  GxMtbRif: {
    id: 'pages.ResultList.GxMtbRif',
    defaultMessage: 'GeneXpert MTB/Rif',
  },
  GxMtbRifUltra: {
    id: 'pages.ResultList.GxMtbRifUltra',
    defaultMessage: 'GeneXpert MTB/Rif Ultra',
  },
  GxHiv1Vl: {
    id: 'pages.ResultList.GxHiv1Vl',
    defaultMessage: 'GeneXpert HIV-1 VL',
  },
  GxHiv1Qual: {
    id: 'pages.ResultList.GxHiv1Qual',
    defaultMessage: 'GeneXpert HIV-1 Qual',
  },
  GxEbola: {
    id: 'pages.ResultList.GxEbola',
    defaultMessage: 'GeneXpert Ebola',
  },
  GxMtbXdr: {
    id: 'pages.ResultList.GxMtbXdr',
    defaultMessage: 'GeneXpert MTB/XDR',
  },
  mtb_detected_rr_detected: {
    id: 'pages.ReportIndex.mtb_detected_rr_detected',
    defaultMessage: 'MTB Detected RR Detected',
  },
  critical_errors_by_device: {
    id: 'pages.ResultList.critical_errors_by_device',
    defaultMessage: 'Critical Errors By Device',
  },
  rif_resistance_rate: {
    id: 'pages.ReportIndex.rif_resistance_rate',
    defaultMessage: 'RIF Resistance Rate (%positive results)',
  },
  results_hiv_not_suppressed: {
    id: 'pages.ReportIndex.results_hiv_not_suppressed',
    defaultMessage: 'Results with HIV Not Suppressed',
  },
  device_activity: {
    id: 'pages.ReportIndex.device_activity',
    defaultMessage: 'Device Activity',
  },
  device_activity_percent: {
    id: 'pages.ReportIndex.device_activity_percent',
    defaultMessage: 'Device Activity (Percent)',
  },
  module_swaps: {
    id: 'pages.ReportIndex.module_swaps',
    defaultMessage: 'Module Swaps',
  },
  device_utilization: {
    id: 'pages.ReportIndex.device_utilization',
    defaultMessage: 'Device Average Utilization per Month',
  },
  device_calibration_report: {
    id: 'pages.ReportIndex.device_calibration_report',
    defaultMessage: 'Device Calibration Report',
  },
  genexpert_issues: {
    id: 'pages.ReportIndex.geneXpertIssues',
    defaultMessage: 'GeneXpert Issues',
  },
  device_summary_report: {
    id: 'pages.ReportIndex.device_summary_report',
    defaultMessage: 'Device Summary Report',
  },
  device_utilization_per_day: {
    id: 'pages.ReportIndex.deviceUtilizationPerDayReport',
    defaultMessage: 'Device Utilization per Day',
  },
  report_custom_fields_completion: {
    id: 'pages.ReportIndex.report_custom_fields_completion',
    defaultMessage: 'Percent of custom fields completion for the MTB form',
  },
  inventory_log: {
    id: 'pages.ReportIndex.inventory_log',
    defaultMessage: 'Inventory Log',
  },
  tb_workload_summary: {
    id: 'pages.ReportIndex.tb_workload_summary',
    defaultMessage: 'Report of TB Workload Summary',
  },
  xdr_devices_summary: {
    id: 'pages.ReportIndex.xdr_devices_summary',
    defaultMessage: 'Summary table for XDR devices',
  },
  module_activity_report: {
    id: 'pages.ReportIndex.module_activity_report',
    defaultMessage: 'Module Activity Report',
  },
  do_not_use_modules_report: {
    id: 'pages.ReportIndex.do_not_use_modules_report',
    defaultMessage: '"Do Not Use" Modules',
  },
  usage_statistics_report: {
    id: 'pages.ReportIndex.usage_statistics_report',
    defaultMessage: 'Usage Statistics Report',
  },
  genxpert_tb_workload_report: {
    id: 'pages.ReportIndex.genxpert_tb_workload_report',
    defaultMessage: 'GeneXpert TB Workload',
  },
  device_and_site_summary_report: {
    id: 'pages.ReportIndex.device_and_site_summary_report',
    defaultMessage: 'Device and Site Sumary',
  },
  result_notifications: {
    id: 'pages.ReportIndex.result_notifications',
    defaultMessage: 'Result Notifications Report',
  },
  abbottM2000DaanNCOVID19: {
    id: 'filter.AssaySelectField.abbottM2000DaanNCOVID19',
    defaultMessage: 'Abbott m2000 Daan N COVID-19',
  },
  abbottM2000DBSHivVL: {
    id: 'filter.AssaySelectField.abbottM2000DBSHivVL',
    defaultMessage: 'Abbott m2000 DBS HIV VL',
  },
  abbottM2000HIVEID: {
    id: 'filter.AssaySelectField.abbottM2000HIVEID',
    defaultMessage: 'Abbott m2000 HIV EID',
  },
  QHivVL: {
    id: 'filter.AssaySelectField.QHivVL',
    defaultMessage: 'Q HIV VL',
  },
  ReporterEID: {
    id: 'filter.AssaySelectField.ReporterEID',
    defaultMessage: 'Reporter EID',
  },
  ReporterHivVL: {
    id: 'filter.AssaySelectField.ReporterHivVL',
    defaultMessage: 'Reporter HIV VL',
  },
  senaiteSmearMicroscopy: {
    id: 'filter.AssaySelectField.senaiteSmearMicroscopy',
    defaultMessage: 'Senaite LIMS Smear Microscopy',
  },
  senaiteTbCulture: {
    id: 'filter.AssaySelectField.senaiteTbCulture',
    defaultMessage: 'Senaite LIMS TB Culture',
  },
  senaiteUnknown: {
    id: 'filter.AssaySelectField.senaiteUnknown',
    defaultMessage: 'Senaite LIMS Unknown',
  },
  module_status_report: {
    id: 'pages.ReportIndex.module_status_report',
    defaultMessage: 'Module Status Report',
  },
  results_10a_10b_covid: {
    id: 'pages.ReportIndex.results_10a_10b_covid',
    defaultMessage: 'Report on Xpert MTB/RIF and Covid',
  },
  results_10a_10b_covid_ntp_use: {
    id: 'pages.ReportIndex.results_10a_10b_covid_ntp_use',
    defaultMessage: 'Report on Xpert MTB/RIF and Covid - NTP Use',
  },

  pk_xpert_site_detailed_report: {
    id: 'pages.ReportIndex.xpert_site_detailed_report',
    defaultMessage: 'Xpert Site Detailed Report',
  },
  pk_missing_cartridges_report: {
    id: 'pages.ReportIndex.pk_missing_cartridges_report',
    defaultMessage: 'List of Unreconciled Inventory',
  },

  ...assay,
  ...resultCategory,
  ...report,
  ...form,
  ...result,
})
