import { defineMessages } from 'react-intl'

const messages = defineMessages({
  reportsTitle: {
    id: 'pages.ReportIndex.title',
    defaultMessage: 'Reports',
  },
  Results_HIV_Not_Suppressed: {
    id: 'pages.ReportIndex.Results_HIV_Not_Suppressed',
    defaultMessage: 'Results with HIV Not Suppressed',
  },
  RIF_Resistance_Rate: {
    id: 'pages.ReportIndex.RIF_Resistance_Rate',
    defaultMessage: 'RIF Resistance Rate (%positive results)',
  },
  Critical_Errors_By_Device: {
    id: 'pages.ReportIndex.Critical_Errors_By_Device',
    defaultMessage: 'Critical Errors By Device',
  },
  criticalErrorsByModule: {
    id: 'pages.ReportIndex.criticalErrorsByModule',
    defaultMessage: 'Critical Errors By Module',
  },
  criticalErrorsByModule_description: {
    id: 'pages.ReportIndex.criticalErrorsByModule_description',
    defaultMessage: 'Includes a list of GeneXpert modules that had at least 1 critical error',
  },
  all_results: {
    id: 'pages.ReportIndex.all_results',
    defaultMessage: 'All Results',
  },
  all_results_description: {
    id: 'pages.ReportIndex.all_results_description',
    defaultMessage: 'All test results in the system. One row per result with all the fields needed.',
  },
  data_extract: {
    id: 'pages.ReportIndex.data_extract',
    defaultMessage: 'Data Extract for Tableau',
  },
  data_extract_description: {
    id: 'pages.ReportIndex.data_extract_description',
    defaultMessage: 'Extract data for selected date range for further importing into Tableau.',
  },
  reportDrTb10a10bCovidNtpUse: {
    id: 'pages.ReportIndex.reportDrTb10a10bCovidNtpUse',
    defaultMessage: 'Xpert MTB/RIF and Covid - NTP Use',
  },
  reportDrTb10a10bCovidDescriptionNtpUse: {
    id: 'pages.ReportIndex.reportDrTb10a10bCovidNtpUse_description',
    defaultMessage: 'DR-TB 10A-10B and Covid reporting format for the Monthly report on Xpert Results- NTP Use.',
  },
  deviceShortSummaryReport: {
    id: 'pages.ReportIndex.deviceShortSummaryReport',
    defaultMessage: 'Device Short Summary Report',
  },
  deviceShortSummaryReportDescription: {
    id: 'pages.ReportIndex.deviceShortSummaryReportDescription',
    defaultMessage: 'Compact version of Device and Site Summary Report',
  },
  doNotUseModulesReport: {
    id: 'pages.ReportIndex.doNotUseModulesReport',
    defaultMessage: '"Do Not Use" Modules',
  },
  doNotUseModulesReport_Description: {
    id: 'pages.ReportIndex.doNotUseModulesReport_Description',
    defaultMessage:
      "A list of all GeneXpert device modules marked as 'do not use'. Includes device name, module serial.",
  },
  unusedModulesReport: {
    id: 'pages.ReportIndex.unusedModulesReport',
    defaultMessage: 'Unused Modules',
  },
  unusedModulesReport_Description: {
    id: 'pages.ReportIndex.unusedModulesReport_Description',
    defaultMessage: "Shows all devices that haven't used all available modules in the selected time period.",
  },
  no_stock: {
    id: 'pages.ReportIndex.no_stock',
    defaultMessage: '"No Stock" Inventory Report',
  },
  no_stock_description: {
    id: 'pages.ReportIndex.no_stock_description',
    defaultMessage: 'Showing all sites/devices and the number of days which they had no stock in the last month.',
  },
  result_notifications_report: {
    id: 'pages.ReportIndex.result_notifications_report',
    defaultMessage: 'Result Notifications Report',
  },
  result_notifications_report_description: {
    id: 'pages.ReportIndex.result_notifications_report_description',
    defaultMessage: 'This report lists all mails and sms delivered because a result is created or updated.',
  },
  MTB_Detected_RR_Detected: {
    id: 'pages.ReportIndex.MTB_Detected_RR_Detected',
    defaultMessage: 'MTB Detected RR Detected',
  },
  deviceActivityReport: {
    id: 'pages.ReportIndex.deviceActivityReport',
    defaultMessage: 'Device Activity',
  },
  deviceActivityPercentReport: {
    id: 'pages.ReportIndex.deviceActivityPercentReport',
    defaultMessage: 'Device Activity (Percent)',
  },
  moduleSwapsReport: {
    id: 'pages.ReportIndex.moduleSwapsReport',
    defaultMessage: 'Module Swaps',
  },
  Device_Calibration_Report: {
    id: 'pages.ReportIndex.Device_Calibration_Report',
    defaultMessage: 'Device Calibration Report',
  },
  Device_Calibration_Report_description: {
    id: 'pages.ReportIndex.Device_Calibration_Report_description',
    defaultMessage: 'All devices along with the last calibration date and when next calibration is due',
  },
  reportDrTb10a10bCovid: {
    id: 'pages.ReportIndex.reportDrTb10a10bCovid',
    defaultMessage: 'Report on Xpert MTB/RIF and Covid',
  },
  reportDrTb10a10bCovidDescription: {
    id: 'pages.ReportIndex.reportDrTb10a10bCovidDescription',
    defaultMessage: 'DR-TB 10A-10B and Covid reporting format for the Monthly report on Xpert Results',
  },
  geneXpertIssues: {
    id: 'pages.ReportIndex.geneXpertIssues',
    defaultMessage: 'GeneXpert Issues',
  },
  results_hiv_not_suppressed_description: {
    id: 'pages.ReportIndex.results_hiv_not_suppressed_description',
    defaultMessage: 'All HIV results where the virus is not suppressed',
  },
  RIF_Resistance_Rate_description: {
    id: 'pages.ReportIndex.RIF_Resistance_Rate_description',
    defaultMessage: 'Listing RIF Resistance Rate for all facilities, ranked highest to lowest',
  },
  Critical_Errors_by_Device_description: {
    id: 'pages.ReportIndex.Critical_Errors_by_Device_description',
    defaultMessage: 'Includes a list of GeneXpert devices that had at least 1 critical errors',
  },
  MTB_Detected_RR_Detected_description: {
    id: 'pages.ReportIndex.MTB_Detected_RR_Detected_description',
    defaultMessage: 'Contains all MTB Detected/Rif Detected cases',
  },
  device_activity_description: {
    id: 'pages.ReportIndex.device_activity_description',
    defaultMessage:
      'This report shows the activity of the devices during the selected period of time, breaking it down by months (By default last 12 months), and all the tests performed during the last year.',
  },
  device_activity_percent_description: {
    id: 'pages.ReportIndex.device_activity_percent_description',
    defaultMessage:
      'This report shows the activity percentage, per month, of the devices during the selected period of time. (By default last 12 months)',
  },
  szMtbStats: {
    id: 'pages.ReportIndex.szSmsStats',
    defaultMessage: 'SMS Stats',
  },
  szSmsStatsDescription: {
    id: 'pages.ReportIndex.szSmsStatsDescription',
    defaultMessage: 'Stats about SMS notifications sent.',
  },
  devicePerformance: {
    id: 'pages.ReportIndex.devicePerformance',
    defaultMessage: 'Device Performance',
  },
  devicePerformance_description: {
    id: 'pages.ReportIndex.devicePerformance_description',
    defaultMessage:
      'This report shows performance rates by device and assay, including: errors, activity, utilization, days offline, and average delay to upload tests. Scoped only to Cepheid GeneXpert devices.',
  },
  moduleSwapsReport_description: {
    id: 'pages.ReportIndex.moduleSwapsReport_description',
    defaultMessage:
      'This report shows all module swaps in devices. The report will show you by default the last 12 months',
  },
  geneXpertIssues_description: {
    id: 'pages.ReportIndex.geneXpertIssues_description',
    defaultMessage: 'This report shows all issues that apply to GeneXpert devices',
  },
  deviceUtilizationReport: {
    id: 'pages.ReportIndex."deviceUtilizationReport"',
    defaultMessage: 'Device Average Utilization per Month',
  },
  device_utilization_description: {
    id: 'pages.ReportIndex.device_utilization_description',
    defaultMessage:
      'This report shows the utilization rate of the devices during the selected period of time, breaking it down by months (By default last 12 months)',
  },
  eid_testing_window: {
    id: 'pages.ReportIndex.eid_testing_window',
    defaultMessage: 'HIV Results with EID testing window',
  },
  eid_testing_window_description: {
    id: 'pages.ReportIndex.eid_testing_window_description',
    defaultMessage: 'HIV-1 Qual EID (Early Infant Diagnosis) aggregated by testing window — Includes results.',
  },
  xpertTestActivitiesReport: {
    id: 'pages.ReportIndex."xpertTestActivitiesReport"',
    defaultMessage: 'Xpert Test Activities Report',
  },
  xpertTestActivitiesReport_description: {
    id: 'pages.ReportIndex.xpertTestActivitiesReport_description',
    defaultMessage: 'This report shows the number of GeneXpert MTB tests performed categorized by result',
  },
  listRResistantTestReport: {
    id: 'pages.ReportIndex.listRResistantTestReport',
    defaultMessage: 'List-R Resistant Test Report',
  },
  listRResistantTestReport_description: {
    id: 'pages.ReportIndex.listRResistantTestReport_description',
    defaultMessage: 'This report shows the list of resistant tests',
  },
  resultCountsByHIVStatus: {
    id: 'pages.ReportIndex.resultCountsByHIVStatus',
    defaultMessage: 'Result Counts by HIV status',
  },
  resultCountsByHIVStatus_description: {
    id: 'pages.ReportIndex.resultCountsByHIVStatus_description',
    defaultMessage: 'Number of TB results grouped by patient HIV status',
  },
  xpertPatientsReport: {
    id: 'pages.ReportIndex.xpertPatientsReport',
    defaultMessage: 'Xpert Patients Report',
  },
  xpertPatientsReport_description: {
    id: 'pages.ReportIndex.xpertPatientsReport_description',
    defaultMessage:
      'This report shows the number of GeneXpert MTB tests performed categorized by result and patients types',
  },

  deviceUtilizationPerDayReport: {
    id: 'pages.ReportIndex.deviceUtilizationPerDayReport',
    defaultMessage: 'Device Utilization per Day',
  },
  deviceUtilizationPerDayDescription: {
    id: 'pages.ReportIndex.deviceActivityPercentReport_description',
    defaultMessage:
      'This report shows the daily utilization of devices in the selected time period per day. The first sheet displays raw numbers, while the second sheet shows the utilization rate based on the device capacity',
  },
  reportCustomFieldsCompletion: {
    id: 'pages.ReportIndex.reportCustomFieldsCompletion',
    defaultMessage: 'Percent of custom fields completion for the MTB form',
  },
  reportCustomFieldsCompletionDescription: {
    id: 'pages.ReportIndex.reportCustomFieldsCompletion_description',
    defaultMessage: 'Lists one row per site and shows the percentage of completion of each MTB custom field',
  },
  inventoryLog: {
    id: 'pages.ReportIndex.inventoryLog',
    defaultMessage: 'Inventory Log',
  },
  inventoryLogDescription: {
    id: 'pages.ReportIndex.inventoryLog_description',
    defaultMessage: 'Lists all the inventory transactions in the filters scope',
  },
  reportTBWorkloadSummary: {
    id: 'pages.ReportIndex.reportTBWorkloadSummary',
    defaultMessage: 'Report of TB Workload Summary',
  },
  reportTBWorkloadSummaryDescription: {
    id: 'pages.ReportIndex.reportTBWorkloadSummaryDescription',
    defaultMessage: 'Summary of TB Workload grouped by month, quarter and year for all regions.',
  },
  xdrDevicesSummary: {
    id: 'pages.ReportIndex.xdrDevicesSummary',
    defaultMessage: 'Summary table for XDR devices',
  },
  xdrDevicesSummaryDescription: {
    id: 'pages.ReportIndex.xdrDevicesSummary_description',
    defaultMessage: 'Lists sites/devices grouped by province showing main XDR parameters',
  },
  moduleActivityReport: {
    id: 'pages.ReportIndex.moduleActivityReport',
    defaultMessage: 'Module Activity Report',
  },
  moduleActivityReport_Description: {
    id: 'pages.ReportIndex.moduleActivityReport_description',
    defaultMessage: 'Shows devices with one or more inactive modules',
  },
  moduleStatusReport: {
    id: 'pages.ReportIndex.moduleStatusReport',
    defaultMessage: 'Module Status Report',
  },
  moduleStatusReport_description: {
    id: 'pages.ReportIndex.moduleStatusReport_Description',
    defaultMessage:
      'Lists the number of currently active/disabled modules, and also the number of modules replaced in a period of time defined by filters',
  },
  usageStatistics: {
    id: 'pages.ReportIndex.usageStatistics',
    defaultMessage: 'Usage Statistics Report',
  },
  usageStatistics_Description: {
    id: 'pages.ReportIndex.usageStatistics_description',
    defaultMessage: 'Shows stats about the use of the system.',
  },
  deviceAndSiteSummaryReport: {
    id: 'pages.ReportIndex.DeviceAndSiteSummaryReport',
    defaultMessage: 'Device and Site Summary Report',
  },
  deviceAndSiteSummaryReport_description: {
    id: 'pages.ReportIndex.DeviceAndSiteSummaryReport_description',
    defaultMessage:
      'An overview of all devices in the system, information about inventory in sites, and aggregated test results per device. This is the old and improved report of GxAlert called "All Devices"',
  },
  geneXpertTbWorkloadReport: {
    id: 'pages.ReportIndex.geneXpertTbWorkloadReport',
    defaultMessage: 'GeneXpert TB Workload',
  },
  geneXpertTbWorkload_description: {
    id: 'pages.ReportIndex.geneXpertTbWorkload_description',
    defaultMessage:
      'Displays all the MTB Rif/MTB Rif Ultra/MTB XDR devices and the number of results per result category, alongside the number of modules in use, days of interruption, and error-rate related fields.',
  },
  error_rate: {
    id: 'pages.ReportIndex.error_rate',
    defaultMessage: 'Error Rate',
  },
  error_rate_description: {
    id: 'pages.ReportIndex.error_rate_description',
    defaultMessage: 'Report error rates per quarter, break them down by devices, modules and users',
  },
  xpert_site_detailed_report: {
    id: 'pages.ReportIndex.xpert_site_detailed_report',
    defaultMessage: 'Xpert Site Detailed Report',
  },
  xpert_site_detailed_report_description: {
    id: 'pages.ReportIndex.xpert_site_detailed_report_description',
    defaultMessage: 'Xpert Implementation Site (XIS) Performance Report.',
  },
  deviceSummaryReport: {
    id: 'pages.ReportIndex.deviceSummaryReport',
    defaultMessage: 'Device Summary Report',
  },
  unreconciled_inventory_report: {
    id: 'pages.ReportIndex.unreconciled_inventory_report',
    defaultMessage: 'List of Unreconciled Inventory',
  },
  deviceSummaryReportDescription: {
    id: 'pages.ReportIndex.deviceSummaryReportDescription',
    defaultMessage: 'A list of all devices in the system and aggregated test results per device.',
  },
  missing_cartridges_report: {
    id: 'pages.ReportIndex.missing_cartridges_report',
    defaultMessage: 'List of Missing Lots',
  },
  unreconciled_inventory_report_description: {
    id: 'pages.ReportIndex.unreconciled_inventory_report_description',
    defaultMessage:
      "Tests detected for following expiration dates where inventory is not tracked at the device's location or the warehouse that serves that location.",
  },
  genericReportErrorMessage: {
    id: 'reports.genericReportErrorMessage',
    defaultMessage: `Failed to generate {fileType} report "{reportName}" because of error "{errorMessage}".
      Please, try again in a few minutes. If the error persists, contact your administrator for support.`,
  },
  genericReportErrorTitle: {
    id: 'reports.genericReportErrorTitle',
    defaultMessage: 'Error Fetching Report',
  },
  tooMuchDataErrorMessage: {
    id: 'reports.tooMuchDataErrorMessage',
    defaultMessage: `Failed to generate {fileType} report "{reportName}" because of Database Timeout: You might be trying to download too much data.`,
  },
})
export default messages
