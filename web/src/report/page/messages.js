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
  MTB_Detected_RR_Detected: {
    id: 'pages.ReportIndex.MTB_Detected_RR_Detected',
    defaultMessage: 'MTB Detected RR Detected',
  },
  deviceActivityReport: {
    id: 'pages.ReportIndex.deviceActivityReport',
    defaultMessage: 'Device Activity',
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
    defaultMessage:
      'Listing RIF Resistance Rate for all facilities, ranked highest to lowest',
  },
  Critical_Errors_By_Device_description: {
    id: 'pages.ReportIndex.Critical_Errors_By_Device_description',
    defaultMessage:
      'Includes a list of devices that had at least 2 critical errors',
  },
  MTB_Detected_RR_Detected_description: {
    id: 'pages.ReportIndex.MTB_Detected_RR_Detected_description',
    defaultMessage: 'Contains all MTB Detected/RR Detected cases',
  },
  device_activity_description: {
    id: 'pages.ReportIndex.device_activity_description',
    defaultMessage:
      'This report shows the activity of the devices during the selected period of time, breaking it down by months (By default last 12 months), and all the tests performed during the last year.',
  },
  device_percent_activity_description: {
    id: 'pages.ReportIndex.device_percent_activity_description',
    defaultMessage:
      'This report shows the utilization rate of the devices during the selected period of time, breaking it down by months (By default last 12 months), and all the tests performed during the last year.',
  },
  moduleSwapsReport_description: {
    id: 'pages.ReportIndex.moduleSwapsReport_description',
    defaultMessage:
      'This report shows all module swaps in devices. The report will show you by default the last 12 months',
  },
  Device_Calibration_Report_description: {
    id: 'pages.ReportIndex.Device_Calibration_Report_description',
    defaultMessage:
      'All devices along with the last calibration date and when next calibration is due',
  },
  geneXpertIssues_description: {
    id: 'pages.ReportIndex.geneXpertIssues_description',
    defaultMessage:
      'This report shows all issues that apply to GeneXpert devices',
  },
})
export default messages
