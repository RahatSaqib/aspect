const mtbDetectedRRDetected = {
  name: 'MTB Detected RR Detected',
  description: 'Contains all MTB Detected/RR Detected cases',
  i18nKey: 'MTB_Detected_RR_Detected',
  i18nKeyDescription: 'MTB_Detected_RR_Detected_description',
  externalId: 'mtb_detected_rr_detected',
  fileName: 'MTB_Detected_RR_Detected',
  sortOrder: 0,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/service',
      functionName: 'getResultsForReport',
      query: {
        sortCol: 'endedOn',
        sortDir: 'desc',
        assayId: 'GxMtbRif',
        resultCategoryId: 'Detected',
        resultCategory2Id: 'Detected',
      },
    },
  ],
}
const allResults = {
  name: 'All Results',
  description:
    'All test results in the system (Limited in 50k results for avoid delays and performance issues). One row per result with all the fields needed.',
  i18nKey: 'all_results',
  i18nKeyDescription: 'all_results_description',
  externalId: 'all_results',
  fileName: 'All_results',
  sortOrder: 0,
  exportCsv: true,
  exportExcel: false,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReport',
      functionName: 'getAllResultsForExport',
      query: {
        sortCol: 'endedOn',
        sortDir: 'desc',
        templateFolderPath: 'export/results',
        maxNumberOfRecords: 50000,
      },
    },
  ],
}
const criticalErrorsByDevice = {
  name: 'Critical Errors By Device',
  description: 'Includes a list of devices that had at least 2 critical errors',
  i18nKey: 'Critical_Errors_By_Device',
  i18nKeyDescription: 'Critical_Errors_By_Device_description',
  externalId: 'critical_errors_by_device',
  fileName: 'DevicesWithErrors',
  sortOrder: 2,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/service',
      functionName: 'getDevicesForReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
        assayId: 'GxMtbRif',
      },
    },
  ],
}

const rifResistanceRate = {
  name: 'RIF Resistance Rate (%positive results)',
  description:
    'Listing RIF Resistance Rate for all facilities, ranked highest to lowest',
  i18nKey: 'RIF_Resistance_Rate',
  externalId: 'rif_resistance_rate',
  i18nKeyDescription: 'RIF_Resistance_Rate_description',
  fileName: 'RifResistanceRate',
  sortOrder: 3,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/service',
      functionName: 'getDevicesForRifResistanceReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
        assayId: 'GxMtbRif',
        resultCategoryId: 'Detected',
        resultCategory2Id: 'Detected',
      },
    },
  ],
}

const resultsHivNotSuppressed = {
  name: 'Results with HIV Not Suppressed',
  description: 'All HIV results where the virus is not suppressed',
  i18nKey: 'Results_HIV_Not_Suppressed',
  externalId: 'results_hiv_not_suppressed',
  i18nKeyDescription: 'results_hiv_not_suppressed_description',
  fileName: 'HIVNotSuppressed',
  sortOrder: 4,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/service',
      functionName: 'getResultsForReport',
      query: {
        sortCol: 'endedOn',
        sortDir: 'desc',
        assayId: 'GxHiv1Vl',
        resultCategoryId: 'MoreThan1000',
      },
    },
  ],
}

const deviceActivity = {
  name: 'Device Activity',
  description:
    'This report shows the activity of the devices during the selected period of time, breaking it down by months (By default last 12 months), and all the tests performed during the last year.',
  i18nKey: 'deviceActivityReport',
  externalId: 'device_activity',
  i18nKeyDescription: 'device_activity_description',
  fileName: 'deviceActivity',
  sortOrder: 5,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getDeviceActivityReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
    {
      sortOrder: 1,
      moduleName: 'device/serviceReports',
      functionName: 'getDeviceActivityReport',
      query: {
        groupBy: 'r.assayId',
        select: 'a.name as assayName',
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}
const deviceUtilizationReport = {
  name: 'Device Average Utilization per Month',
  description:
    'This report shows the utilization rate of the devices during the selected period of time, breaking it down by months (By default last 12 months)',
  i18nKey: 'deviceUtilizationReport',
  externalId: 'device_utilization',
  i18nKeyDescription: 'device_utilization_description',
  fileName: 'deviceUtilization',
  sortOrder: 7,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getDeviceCapacityReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}

const deviceActivityPercent = {
  name: 'Device Activity (Percent)',
  description:
    'This report shows the activity percentage, per month, of the devices during the selected period of time. (By default last 12 months)',
  i18nKey: 'deviceActivityPercentReport',
  externalId: 'device_activity_percent',
  i18nKeyDescription: 'device_activity_percent_description',
  fileName: 'deviceActivityPercent',
  sortOrder: 6,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'deviceMaintenanceStatus/serviceReports',
      functionName: 'getDeviceActivityPercentReport',
      query: {
        sortCol: 'name',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}

const moduleSwaps = {
  name: 'Module Swaps',
  description:
    'This report shows all module swaps in devices. The report will show you by default the last 12 months',
  i18nKey: 'moduleSwapsReport',
  externalId: 'module_swaps',
  fileName: 'moduleSwaps',
  i18nKeyDescription: 'moduleSwapsReport_description',
  sortOrder: 7,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getModuleSwapsReport',
      query: {
        sortCol: 'deviceName',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}

const deviceCalibrationReport = {
  name: 'Device Calibration Report',
  description:
    'All devices along with the last calibration date and when next calibration is due',
  i18nKey: 'Device_Calibration_Report',
  i18nKeyDescription: 'Device_Calibration_Report_description',
  externalId: 'device_calibration_report',
  fileName: 'DeviceCalibrationReport',
  sortOrder: 8,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/service',
      functionName: 'getDeviceCalibrationsForReport',
      query: {
        hasResults: 1,
        sortCol: 'name',
        sortDir: 'asc',
        avoidStreaming: true,
      },
    },
  ],
}

const geneXpertIssues = {
  name: 'GeneXpert Issues',
  description: 'This report shows all issues that apply to GeneXpert devices',
  i18nKey: 'geneXpertIssues',
  i18nKeyDescription: 'geneXpertIssues_description',
  externalId: 'genexpert_issues',
  fileName: 'geneXpertIssues',
  sortOrder: 9,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getGeneXpertIssuesReport',
      query: {
        sortCol: 'triggeredOn',
        sortDir: 'asc',
        hasResults: 1,
      },
    },
  ],
}

const utilizationPerInstrumentDayReport = {
  name: 'Device Utilization per Day',
  description:
    'This report shows the daily utilization of devices in the selected time period per day. The first sheet displays raw numbers, while the second sheet shows the utilization rate based on the device capacity',
  i18nKey: 'deviceUtilizationPerDayReport',
  externalId: 'device_utilization_per_day',
  i18nKeyDescription: 'deviceUtilizationPerDayDescription',
  fileName: 'deviceUtilizationPerDay',
  sortOrder: 11,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'deviceMaintenanceStatus/serviceReports',
      functionName: 'getDeviceUtilizationPerDayReport',
    },
    {
      sortOrder: 0,
      moduleName: 'deviceMaintenanceStatus/serviceReports',
      functionName: 'getDeviceUtilizationPerDayReportPercentage',
    },
  ],
}

const moduleActivityReport = {
  name: 'Module Activity Report',
  description: 'Shows devices with one or more inactive modules',
  i18nKey: 'moduleActivityReport',
  i18nKeyDescription: 'moduleActivityReport_Description',
  externalId: 'module_activity_report',
  fileName: 'module_activity_report',
  exportCsv: true,
  sortOrder: 120,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReport',
      functionName: 'getModuleActivityReport',
    },
  ],
}

module.exports = {
  resultsHivNotSuppressed,
  rifResistanceRate,
  criticalErrorsByDevice,
  mtbDetectedRRDetected,
  deviceActivity,
  deviceActivityPercent,
  moduleSwaps,
  deviceUtilizationReport,
  deviceCalibrationReport,
  geneXpertIssues,
  allResults,
  utilizationPerInstrumentDayReport,
  moduleActivityReport,
}
