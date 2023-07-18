const xdrDevicesSummary = {
  name: 'Summary table for XDR devices',
  description: 'Lists sites/devices grouped by province showing main XDR parameters',
  i18nKey: 'xdrDevicesSummary',
  externalId: 'xdr_devices_summary', // folder name in /templates
  i18nKeyDescription: 'xdrDevicesSummaryDescription',
  availableForNotification: 1,
  fileName: 'XdrDevicesSummary',
  exportCsv: false,
  sortOrder: 101,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReport',
      functionName: 'getReportXdrDevicesSummary',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

const mtbDetectedRRDetected = {
  name: 'MTB Detected RR Detected',
  description: 'Contains all MTB Detected/Rif Detected cases',
  i18nKey: 'MTB_Detected_RR_Detected',
  i18nKeyDescription: 'MTB_Detected_RR_Detected_description',
  externalId: 'mtb_detected_rr_detected',
  fileName: 'MTB_Detected_RR_Detected',
  sortOrder: 0,
  availableForNotification: 1,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/service',
      functionName: 'getResultsForReport',
      query: {
        sortCol: 'endedOn',
        sortDir: 'desc',
        resultCategoryGroupId: ['GxMtbRifMtbDetectedRifDetected', 'GxMtbRifUltraMtbDetectedRifDetected'],
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
  availableForNotification: 1,
  exportCsv: true,
  exportExcel: true,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReport',
      functionName: 'getAllResultsForExport',
      query: {
        sortCol: 'endedOn',
        sortDir: 'desc',
        // templateFolderPath: 'export/results',
        maxNumberOfRecords: 1000000,
        streamCSV: true,
      },
    },
  ],
}
const criticalErrorsByDevice = {
  name: 'Critical Errors By Device',
  description: 'Includes a list of GeneXpert devices that had at least 2 critical errors',
  i18nKey: 'Critical_Errors_By_Device',
  i18nKeyDescription: 'Critical_Errors_By_Device_description',
  externalId: 'critical_errors_by_device',
  fileName: 'DevicesWithErrors',
  availableForNotification: 1,
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
        deviceTypeId: 'CepheidGeneXpert',
      },
    },
    {
      sortOrder: 1,
      moduleName: 'device/serviceReports',
      functionName: 'getErrorsByDevicesReport',
      query: {
        hasResults: 1,
        sortCol: 'deviceName',
        sortDir: 'asc',
        avoidStreaming: true,
      },
    },
  ],
}

const rifResistanceRate = {
  name: 'RIF Resistance Rate (%positive results)',
  description: 'Listing MTB/Rif and MTB/Rif Ultra Resistance Rate for all GeneXpert devices, ranked highest to lowest',
  i18nKey: 'RIF_Resistance_Rate',
  externalId: 'rif_resistance_rate',
  i18nKeyDescription: 'RIF_Resistance_Rate_description',
  fileName: 'RifResistanceRate',
  sortOrder: 3,
  availableForNotification: 1,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/service',
      functionName: 'getDevicesForRifResistanceReport',
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
  availableForNotification: 1,
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
  availableForNotification: 1,
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
  availableForNotification: 1,
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
  availableForNotification: 1,
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
  description: 'This report shows all module swaps in devices. The report will show you by default the last 12 months',
  i18nKey: 'moduleSwapsReport',
  externalId: 'module_swaps',
  fileName: 'moduleSwaps',
  i18nKeyDescription: 'moduleSwapsReport_description',
  availableForNotification: 1,
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
  description: 'All devices along with the last calibration date and when next calibration is due',
  i18nKey: 'Device_Calibration_Report',
  i18nKeyDescription: 'Device_Calibration_Report_description',
  externalId: 'device_calibration_report',
  fileName: 'DeviceCalibrationReport',
  availableForNotification: 1,
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
  availableForNotification: 1,
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
  availableForNotification: 1,
  sortOrder: 11,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'deviceMaintenanceStatus/serviceReports',
      functionName: 'getDeviceUtilizationPerDayReport',
    },
  ],
}

const moduleActivityReport = {
  name: 'Module Activity Report',
  description: 'Shows devices with one or more inactive modules',
  i18nKey: 'moduleActivityReport',
  i18nKeyDescription: 'moduleActivityReport_Description',
  externalId: 'module_activity_report',
  fileName: 'ModuleActivityReport',
  availableForNotification: 1,
  exportCsv: true,
  sortOrder: 120,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getModuleActivityReport',
    },
  ],
}

const doNotUseModulesReport = {
  name: "'Do Not Use' Modules",
  description: "A list of all GeneXpert device modules marked as 'do not use'. Includes device name, module serial.",
  i18nKey: 'doNotUseModulesReport',
  i18nKeyDescription: 'doNotUseModulesReport_Description',
  externalId: 'do_not_use_modules_report',
  fileName: 'DoNotUseModulesReport',
  availableForNotification: 1,
  exportCsv: true,
  sortOrder: 125,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getDoNotUseModulesReport',
    },
  ],
}

const moduleStatusReport = {
  name: 'Module Status Report',
  description:
    'Lists the number of currently active/disabled modules, and also the number of modules replaced in a period of time defined by filters.',
  i18nKey: 'moduleStatusReport',
  i18nKeyDescription: 'moduleStatusReport_Description',
  externalId: 'module_status_report',
  fileName: 'ModuleStatusReport',
  availableForNotification: 1,
  exportCsv: true,
  exportExcel: true,
  sortOrder: 130,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getModuleStatusReport',
    },
  ],
}

const reportCustomFieldsCompletion = {
  name: 'Percent of custom fields completion for the MTB form',
  description: 'Lists one row per site and shows the percentage of completion of each MTB custom field',
  i18nKey: 'reportCustomFieldsCompletion',
  externalId: 'report_custom_fields_completion', // folder name in /templates
  i18nKeyDescription: 'reportCustomFieldsCompletionDescription',
  fileName: 'ReportCustomFieldsCompletion',
  availableForNotification: 1,
  exportCsv: false,
  sortOrder: 13,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/service',
      functionName: 'getCustomFieldsCompletion',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

const inventoryLog = {
  name: 'Inventory Log',
  description: 'Lists all the inventory transactions in the filters scope',
  i18nKey: 'inventoryLog',
  externalId: 'inventory_log',
  availableForNotification: 1,
  i18nKeyDescription: 'inventoryLogDescription',
  fileName: 'InventoryLog',
  exportCsv: false,
  sortOrder: 14,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'inventory/serviceReports',
      functionName: 'inventoryLog',
      query: {
        avoidStreaming: true,
      },
    },
  ],
}

const tbWorkloadSummary = {
  name: 'Report of TB Workload Summary',
  description:
    'Summary of TB Workload (MTB RIf and Ultra only for last 5 years) grouped by month, quarter and year for all regions.',
  i18nKey: 'reportTBWorkloadSummary',
  externalId: 'tb_workload_summary', // folder name in /templates
  i18nKeyDescription: 'reportTBWorkloadSummaryDescription',
  availableForNotification: 1,
  fileName: 'ReportTBWorkloadSummary',
  exportCsv: false,
  sortOrder: 15,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReport',
      functionName: 'getReportWorkloadSummary',
      query: {
        avoidStreaming: true,
        assay: ['GxMtbRif', 'GxMtbRifUltra'],
        groupBy: ['month', 'state', 'resultCategory1', 'resultCategory2'],
        minDate: '2019-01-01',
        nameOfSharedData: 'workload-summary-grouped-by-month',
      },
    },
    {
      sortOrder: 1,
      moduleName: 'result/serviceReport',
      functionName: 'getReportWorkloadSummaryByQuarter',
      query: {
        avoidStreaming: true,
        useNamedData: 'workload-summary-grouped-by-month',
      },
    },
    {
      sortOrder: 2,
      moduleName: 'result/serviceReport',
      functionName: 'getReportWorkloadSummaryByYear',
      query: {
        avoidStreaming: true,
        useNamedData: 'workload-summary-grouped-by-month',
      },
    },
  ],
}

const usageStats = {
  name: 'Usage Statistics Report',
  description: 'Shows stats about the use of the system.',
  i18nKey: 'usageStatistics',
  i18nKeyDescription: 'usageStatistics_Description',
  externalId: 'usage_statistics_report',
  fileName: 'UsageStatistics',
  exportCsv: false,
  exportExcel: true,
  availableForNotification: 1,
  sortOrder: 140,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'stats/serviceReports',
      functionName: 'getUsageStats',
    },
    {
      sortOrder: 1,
      moduleName: 'stats/serviceReports',
      functionName: 'getUserActivity',
    },
    {
      sortOrder: 2,
      moduleName: 'stats/serviceReports',
      functionName: 'getResultsBySite',
    },
  ],
}

const geneXpertTBWorkloadReport = {
  name: 'GeneXpert TB Workload',
  description:
    'Displays all the MTB Rif/MTB Rif Ultra/MTB XDR devices and the number of results per result category, alongside the number of modules in use, days of interruption, and error-rate related fields.',
  i18nKey: 'geneXpertTbWorkloadReport',
  i18nKeyDescription: 'geneXpertTbWorkload_description',
  externalId: 'genxpert_tb_workload_report',
  fileName: 'GeneXpert_TB_Workload',
  exportCsv: false,
  availableForNotification: 1,
  sortOrder: 150,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getDevicesWithCountsForTBReport',
      query: {
        hasResults: 1,
        sortCol: 'name',
        sortDir: 'asc',
        avoidStreaming: true,
      },
    },
  ],
}

const devicesAndSitesOverview = {
  name: 'GeneXpert Devices and Sites Overview',
  description:
    'An overview of all GeneXpert devices in the system, information about inventory, and aggregated test results and errors per device.',
  i18nKey: 'devicesAndSitesOverview',
  i18nKeyDescription: 'devicesAndSites_description',
  externalId: 'devices_and_sites_overview',
  fileName: 'DevicesAndSitesOverview',
  exportCsv: false,
  availableForNotification: 1,
  sortOrder: 150,
  sheets: [
    /**
     * sheet `GeneXpert Devices`
     */
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getAllDeviceReport',
      query: {
        hasResults: 1,
        sortCol: 'name',
        sortDir: 'asc',
        avoidStreaming: true,
      },
    },
    /**
     * sheet `GeneXpert Inventory by Site`
     */
    {
      sortOrder: 1,
      moduleName: 'device/serviceReports/devicesAndSitesOverviewReport',
      functionName: 'getInventoryData',
      query: {
        hasResults: 1,
        sortCol: 'name',
        sortDir: 'asc',
        avoidStreaming: true,
      },
    },
    /**
     * sheet `GeneXpert Errors by Devices`
     */
    {
      sortOrder: 2,
      moduleName: 'device/serviceReports',
      functionName: 'getErrorsByDevicesReport',
      query: {
        hasResults: 1,
        sortCol: 'deviceName',
        sortDir: 'asc',
        avoidStreaming: true,
      },
    },
  ],
}

/**
 * Error rates report
 */
const errorRatesReport = {
  name: 'Error Rate',
  description: 'Report error rates per quarter, break them down by devices, modules and users',
  i18nKey: 'error_rate',
  i18nKeyDescription: 'error_rate_description',
  externalId: 'error_rate',
  fileName: 'ErrorRate',
  sortOrder: 170,
  availableForNotification: 1,
  exportCsv: false,
  exportExcel: true,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'getErrorRateByDeviceReport',
      query: {
        streamCSV: true,
      },
    },
    {
      sortOrder: 1,
      moduleName: 'device/serviceReports',
      functionName: 'getErrorRateByModuleReport',
      query: {
        streamCSV: true,
      },
    },
    {
      sortOrder: 2,
      moduleName: 'device/serviceReports',
      functionName: 'getErrorRateByUserReport',
      query: {
        streamCSV: true,
      },
    },
  ],
}

/**
 * see section `Tuning MySql` in api/README.md
 */
const dataExtract = {
  name: 'Data Extract',
  description: 'Extract all data in the system for either selected date range or maximum for one year.',
  i18nKey: 'data_extract',
  i18nKeyDescription: 'data_extract_description',
  externalId: 'data_extract',
  fileName: 'DataExtract',
  sortOrder: 0,
  availableForNotification: 0,
  exportCsv: true,
  exportExcel: false,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'result/serviceReport',
      functionName: 'getDataExtractReport',
      query: {
        sortCol: 'updatedOn',
        sortDir: 'desc',
        streamCSV: true,
      },
    },
  ],
}

/**
 * No Stock report
 */
const inventoryNoStock = {
  name: '"No Stock" Inventory Report',
  description: 'Showing all sites/devices and the number of days which they had no stock in the last month.',
  i18nKey: 'no_stock',
  i18nKeyDescription: 'no_stock_description',
  externalId: 'no_stock',
  fileName: 'NoStock',
  sortOrder: 0,
  availableForNotification: 1,
  exportCsv: false,
  exportExcel: true,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'device/serviceReports',
      functionName: 'noStockInventoryReport',
      query: {
        sortCol: 'deviceName',
        sortDir: 'asc',
        streamCSV: true,
      },
    },
  ],
}

const resultNotificationsReport = {
  name: 'Result Notifications Report',
  description: 'This report lists all mails and sms delivered because a result is created or updated.',
  i18nKey: 'result_notifications_report',
  i18nKeyDescription: 'result_notifications_report_description',
  externalId: 'result_notifications', // folder name in /templates with low dash casing
  fileName: 'ResultNotification',
  exportCsv: false,
  exportExcel: true,
  availableForNotification: 1,
  sortOrder: 160,
  sheets: [
    {
      sortOrder: 0,
      moduleName: 'notification/serviceReports/index',
      functionName: 'getResultSmsNotificationData',
    },
    {
      sortOrder: 1,
      moduleName: 'notification/serviceReports/index',
      functionName: 'getResultEmailNotificationData',
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
  geneXpertIssues,
  deviceUtilizationReport,
  deviceCalibrationReport,
  geneXpertTBWorkloadReport,
  allResults,
  utilizationPerInstrumentDayReport,
  moduleActivityReport,
  doNotUseModulesReport,
  reportCustomFieldsCompletion,
  inventoryLog,
  moduleStatusReport,
  tbWorkloadSummary,
  xdrDevicesSummary,
  usageStats,
  errorRatesReport,
  devicesAndSitesOverview,
  dataExtract,
  resultNotificationsReport,
  inventoryNoStock,
}
