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
  all_results: {
    id: 'pages.ReportIndex.all_results',
    defaultMessage: 'All Results',
  },
  all_results_description: {
    id: 'pages.ReportIndex.all_results_description',
    defaultMessage:
      'All test results in the system (up to 50.000 records). One row per result with all the fields needed.',
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
  Critical_Errors_By_Device_description: {
    id: 'pages.ReportIndex.Critical_Errors_By_Device_description',
    defaultMessage: 'Includes a list of GeneXpert devices that had at least 2 critical errors',
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
  moduleSwapsReport_description: {
    id: 'pages.ReportIndex.moduleSwapsReport_description',
    defaultMessage:
      'This report shows all module swaps in devices. The report will show you by default the last 12 months',
  },
  Device_Calibration_Report_description: {
    id: 'pages.ReportIndex.Device_Calibration_Report_description',
    defaultMessage: 'All devices along with the last calibration date and when next calibration is due',
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
  deviceActivityPercentReport_description: {
    id: 'pages.ReportIndex.deviceActivityPercentReport_description',
    defaultMessage:
      'This report shows the daily utilization of devices in the selected time period per day. The first sheet displays raw numbers, while the second sheet shows the utilization rate based on the device capacity',
  },
  reportCustomFieldsCompletion: {
    id: 'pages.ReportIndex.reportCustomFieldsCompletion',
    defaultMessage: 'Percent of custom fields completion for the MTB form',
  },
  reportCustomFieldsCompletion_description: {
    id: 'pages.ReportIndex.reportCustomFieldsCompletion_description',
    defaultMessage: 'Lists one row per site and shows the percentage of completion of each MTB custom field',
  },
  inventoryLog: {
    id: 'pages.ReportIndex.inventoryLog',
    defaultMessage: 'Inventory Log',
  },
  inventoryLog_description: {
    id: 'pages.ReportIndex.inventoryLog_description',
    defaultMessage: 'Lists all the inventory transactions in the filters scope',
  },
  reportTBWorkloadSummary: {
    id: 'pages.ReportIndex.reportTBWorkloadSummary',
    defaultMessage: 'Report of TB Workload Summary',
  },
  reportTBWorkloadSummary_description: {
    id: 'pages.ReportIndex.reportTBWorkloadSummary_description',
    defaultMessage: 'Summary of TB Workload grouped by month, quarter and year for all regions',
  },
  xdrDevicesSummary: {
    id: 'pages.ReportIndex.xdrDevicesSummary',
    defaultMessage: 'Summary table for XDR devices',
  },
  xdrDevicesSummary_description: {
    id: 'pages.ReportIndex.xdrDevicesSummary_description',
    defaultMessage: 'Lists sites/devices grouped by province showing main XDR parameters',
  },
  moduleActivityReport: {
    id: 'pages.ReportIndex.moduleActivityReport',
    defaultMessage: 'Module Activity Report',
  },
  moduleActivityReport_description: {
    id: 'pages.ReportIndex.moduleActivityReport_description',
    defaultMessage: 'Shows devices with one or more inactive modules',
  },
  usageStatistics: {
    id: 'pages.ReportIndex.usageStatistics',
    defaultMessage: 'Usage Statistics Report',
  },
  usageStatistics_description: {
    id: 'pages.ReportIndex.usageStatistics_description',
    defaultMessage: 'Shows stats about the use of the system.',
  },
  devicesAndSitesOverview: {
    id: 'pages.ReportIndex.devicesAndSitesOverview',
    defaultMessage: 'Devices and Sites Overview',
  },
  devicesAndSites_description: {
    id: 'pages.ReportIndex.devicesAndSites_description',
    defaultMessage:
      'An overview of all devices in the system, information about inventory in sites, and aggregated test results per device. This is the old and improved report of GxAlert called "All Devices" - This report is in BETA version and still in progress.',
  },
  deviceReport: {
    id: 'pages.ReportIndex.deviceReport',
    defaultMessage: 'Device Report',
  },
  deviceReport_description: {
    id: 'pages.ReportIndex.deviceReport_description',
    defaultMessage:
      'Displays all the MTB Rif/MTB Rif Ultra/MTB XDR devices and the number of results per result category, alongside the number of modules in use, days of interruption, and error-rate related fields.',
  },
})
export default messages
