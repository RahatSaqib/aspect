const { getCustomFieldPlaceholdersForNotifications } = require('../forms/service')
const { getConstraints } = require('../auth/constraints')

module.exports = async function (request) {
  const { auth } = request
  const { credentials } = auth

  const allDeviceNotifications = [
    'DeviceNoResults',
    'DeviceOffline',
    'CalibrationDueDate',
    'ModuleReplaced',
    'ModuleDisabled',
    'UnusedModules',
    'DeviceExpectedBackOnline',
  ]

  /**
   * Make sure all strings in `notificationTypeWhitelist` match option.values in
   * `Notification/NotificationFormPage/Forms/notificationTypeSection.js`
   */
  const placeholders = [
    {
      notificationTypeWhitelist: ['reportBased'],
      labelI18nKey: 'placeholderReport',
      label: 'Report',
      options: [
        {
          id: 'report.downloadLink',
          nameI18nKey: 'placeholderReportDownloadLink',
          name: 'Download Link',
        },
        {
          id: 'report.dateRange',
          nameI18nKey: 'placeholderReportDateRange',
          name: 'Date Range',
        },
        {
          id: 'person.name',
          nameI18nKey: 'placeholderReportPersonName',
          name: 'Person',
        },
      ],
    },
    {
      notificationTypeWhitelist: [
        // 'reportBased',
        'resultBased',
        'InventoryStockout',
        'SiteWithLowFieldCompletionRate',
        'InventoryStockExpiring',
        ...allDeviceNotifications,
      ],
      labelI18nKey: 'placeholderSite',
      label: 'Site',
      options: [
        {
          id: 'site.id',
          nameI18nKey: 'placeholderId',
          name: 'Site ID',
        },
        {
          id: 'site.name',
          nameI18nKey: 'placeholderName',
          name: 'Site Name',
        },
        {
          id: 'site.shortName',
          nameI18nKey: 'placeholderNameShort',
          name: 'Site Short Name',
        },
        {
          id: 'site.completionRatePercentage',
          nameI18nKey: 'placeholderCompletionRatePercentage',
          name: 'Custom Fields Completion Rate Percentage',
        },
        {
          id: 'person.name',
          nameI18nKey: 'placeholderSitePersonName',
          name: 'Person',
        },
      ],
    },
    {
      notificationTypeWhitelist: [
        // 'reportBased',
        'resultBased',
        ...allDeviceNotifications,
      ],
      labelI18nKey: 'placeholderDevice',
      label: 'Device',
      options: [
        {
          id: 'device.name',
          nameI18nKey: 'placeholderName',
          name: 'Device Name',
        },
        {
          id: 'device.calibrationDueDate',
          nameI18nKey: 'placeHolderCalibrationDueDate',
          name: 'Calibration Due Date',
        },
        {
          id: 'device.daysToCalibrationDueDate',
          nameI18nKey: 'placeHolderDaysToCalibrationDueDate',
          name: 'Days To Calibration Due Date',
        },
        {
          id: 'device.expectedBackOnlineDate',
          nameI18nKey: 'placeHolderExpectedBackOnlineDate',
          name: 'Expected Back Online Date',
        },
        {
          id: 'numberOfDays device.lastPingOn',
          nameI18nKey: 'placeHolderDaysInactive',
          name: 'Days inactive',
        },
        {
          id: 'person.name',
          nameI18nKey: 'placeholderDevicePersonName',
          name: 'Person',
        },
      ],
    },
    {
      notificationTypeWhitelist: ['resultBased'],
      labelI18nKey: 'placeholderResult',
      label: 'Result',
      options: [
        {
          id: 'result.data.resultText',
          nameI18nKey: 'placeholderResultText',
          name: 'Result Text',
        },
        {
          id: 'result.patient.id',
          nameI18nKey: 'placeholderResultPatientId',
          name: 'Patient ID',
        },
        {
          id: 'result.startedOn',
          nameI18nKey: 'placeholderResultStartedOn',
          name: 'Started On',
        },
        {
          id: 'result.endedOn',
          nameI18nKey: 'placeholderResultEndedOn',
          name: 'Ended On',
        },
        {
          id: 'result.notes',
          nameI18nKey: 'placeholderResultNotes',
          name: 'Notes',
        },
        {
          id: 'result.moduleName',
          nameI18nKey: 'placeholderResultModuleName',
          name: 'Module Name',
        },
        {
          id: 'result.moduleSerial',
          nameI18nKey: 'placeholderResultModuleSerial',
          name: 'Module Serial',
        },
        {
          id: 'result.errorCode',
          nameI18nKey: 'placeholderResultErrorCode',
          name: 'Error Code',
        },
        {
          id: 'result.assay.id',
          nameI18nKey: 'placeholderResultAssay',
          name: 'Assay',
        },
        {
          id: 'result.sample.id',
          nameI18nKey: 'placeholderResultSampleId',
          name: 'Sample ID',
        },
        {
          id: 'result.sample.originSite.id',
          nameI18nKey: 'placeholderResultSampleOriginSite',
          name: 'Origin Site',
        },
        {
          id: 'result.sample.collectedOn',
          nameI18nKey: 'placeholderResultSampleCollectedDate',
          name: 'Collected On',
        },

        {
          id: 'result.category1.id',
          nameI18nKey: 'placeholderResult1',
          name: 'Result 1',
        },
        {
          id: 'result.category2.id',
          nameI18nKey: 'placeholderResult2',
          name: 'Result 2',
        },
        {
          id: 'person.name',
          nameI18nKey: 'placeholderResultPersonName',
          name: 'Person',
        },
        {
          id: 'result.detected.resistances',
          nameI18nKey: 'placeholderResultDetectedResistances',
          name: 'Result Detected Resistances',
        },
      ],
    },
  ]

  const dataConstraints = await getConstraints(credentials)
  const customFieldsPlaceholders = await getCustomFieldPlaceholdersForNotifications(dataConstraints.partner.id)

  if (customFieldsPlaceholders?.length > 0) {
    placeholders.push({
      notificationTypeWhitelist: ['resultBased'],
      labelI18nKey: 'placeholderCustomFields',
      label: 'Result Custom Fields',
      options: customFieldsPlaceholders,
    })
  }

  return { ok: true, data: placeholders }
}
