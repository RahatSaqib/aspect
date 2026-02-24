import { defineMessages } from 'react-intl'

const messages = defineMessages({
  summaryWidgetGroupConnectivity: {
    id: 'pages.Status.summaryWidgetGroup.connectivity',
    defaultMessage: 'Connectivity',
  },
  summaryWidgetGroupInventory: {
    id: 'pages.Status.summaryWidgetGroup.inventory',
    defaultMessage: 'Inventory',
  },
  summaryWidgetGroupDevices: {
    id: 'pages.Status.summaryWidgetGroup.devices',
    defaultMessage: 'Devices',
  },
  summaryWidgetGroupService: {
    id: 'pages.Status.summaryWidgetGroup.service',
    defaultMessage: 'Service',
  },

  /**
   * for widget parts
   */
  dashboardWidgetUnitTests: {
    id: 'component.Widget.dashboardWidgetUnitTests',
    defaultMessage: 'Tests',
  },
  forMtbPositive: {
    id: 'component.Widget.forMtbPositive',
    defaultMessage: 'for {unit} MTB+',
  },
  forResults: {
    id: 'component.Widget.forResults',
    defaultMessage: 'for {unit} Results',
  },
  ofCurrentlyReported: {
    id: 'component.Widget.ofCurrentlyReported',
    defaultMessage: 'of {unit} currently reported',
  },
  lastMonth: {
    id: 'component.Widget.lastMonth',
    defaultMessage: '{unit} last month',
  },
  ofTotalModules: {
    id: 'component.Widget.ofTotalModules',
    defaultMessage: 'of {unit} total modules',
  },
  ofOnlineDevices: {
    id: 'component.Widget.ofOnlineDevices',
    defaultMessage: 'of {unit} online devices',
  },
  sinceLastWeek: {
    id: 'component.Widget.sinceLastWeek',
    defaultMessage: '{unit} since last week',
  },
  ytd: {
    id: 'component.Widget.ytd',
    defaultMessage: '{unit} YTD',
  },
  last30Days: {
    id: 'component.Widget.last30Days',
    defaultMessage: 'Last 30 Days',
  },
  ofAllDevices: {
    id: 'component.Widget.ofAllDevices',
    defaultMessage: '{unit} of all devices',
  },
  totalCalibrations: {
    id: 'component.Widget.totalCalibrations',
    defaultMessage: '{unit} total calibrations',
  },

  /**
   * widget title, subtitle and description
   */
  geneXpertDevicesTitle: {
    id: 'component.Widget.geneXpertDevicesTitle',
    defaultMessage: 'GeneXpert Devices',
  },
  geneXpertDevices: {
    id: 'component.Widget.geneXpertDevices',
    defaultMessage: 'The number of approved GeneXpert devices (excluding decommissioned devices).',
  },
  personTitle: {
    id: 'component.Widget.personTitle',
    defaultMessage: 'Contacts',
  },
  personDescription: {
    id: 'component.Widget.personDescription',
    defaultMessage: 'The number of contacts in the system.',
  },
  devicesTitle: {
    id: 'component.Widget.devicesTitle',
    defaultMessage: 'Devices',
  },
  devicesDescription: {
    id: 'component.Widget.devicesDescription',
    defaultMessage: 'The number of approved devices that perform results (excluding decommissioned devices)',
  },
  resultsTitle: {
    id: 'component.Widget.resultsTitle',
    defaultMessage: 'Results',
  },
  resultsDescription: {
    id: 'component.Widget.resultsDescription',
    defaultMessage: 'The number of results in the last 30 days',
  },
  instrumentsConnectedTitle: {
    id: 'component.Widget.instrumentsConnectedTitle',
    defaultMessage: 'Instruments',
  },
  instrumentsConnectedDescription: {
    id: 'component.Widget.instrumentsConnectedDescription',
    defaultMessage: 'The number of instruments connected to a single laptop in multi-device connector configuration.',
  },
  sitesTitle: {
    id: 'component.Widget.sitesTitle',
    defaultMessage: 'Sites',
  },
  sitesDescription: {
    id: 'component.Widget.sitesDescription',
    defaultMessage: 'The number of sites.',
  },
  dashboardWidgetTestsPerDayTitle: {
    id: 'component.Widget.dashboardWidgetTestsPerDayTitle',
    defaultMessage: 'Tests Per Day',
  },
  dashboardWidgetTestsPerDayDescription: {
    id: 'component.Widget.dashboardWidgetTestsPerDayDescription',
    defaultMessage: 'Average number of tests per weekday conducted this month.',
  },
  dashboardWidgetValidResultsPc: {
    id: 'component.Widget.dashboardWidgetValidResultsPc',
    defaultMessage: 'Valid Results',
  },
  dashboardWidgetValidResultsPcDescription: {
    id: 'component.Widget.dashboardWidgetValidResultsPcDescription',
    defaultMessage:
      'Percentage of valid results reported this month. Valid results includes all results that didn\'t result in "Error", "No Result", or "Invalid".',
  },
  utilizationRateTitle: {
    id: 'component.Widget.utilizationRateTitle',
    defaultMessage: 'Utilization Rate',
  },
  utilizationRateDescription: {
    id: 'component.Widget.utilizationRateDescription',
    defaultMessage:
      'The utilization rate is calculated by counting all tests conducted in the month and dividing that number by the total capacity of all devices. This calculation excludes weekends.',
  },
  activeDevicesTitle: {
    id: 'component.Widget.activeDevicesTitle',
    defaultMessage: 'Active',
  },
  activeDevicesDescription: {
    id: 'component.Widget.activeDevicesDescription',
    defaultMessage: 'The average daily percentage of devices sending results, excluding weekends.',
  },
  StockoutsTitle: {
    id: 'component.Widget.StockoutsTitle',
    defaultMessage: 'Stockouts',
  },
  stockoutsDescription: {
    id: 'component.Widget.stockoutsDescription',
    defaultMessage:
      'The stockout percentage is calculated by counting all sites with stockout issues during the month and dividing by all active sites.',
  },
  deviceDaysActiveTitle: {
    id: 'component.Widget.deviceDaysActiveTitle',
    defaultMessage: 'Days active',
  },
  deviceDaysActiveDescription: {
    id: 'component.Widget.deviceDaysActiveDescription',
    defaultMessage: 'Average number of days each device has been active, excluding weekends.',
  },
  errorRateTitle: {
    id: 'component.Widget.errorRateTitle',
    defaultMessage: 'Error Rate',
  },
  errorRateDescription: {
    id: 'component.Widget.errorRateDescription',
    defaultMessage:
      'The error rate is calculated by counting all errors in the tests conducted in the month and dividing that number by the total tests carried out of all devices.',
  },
  stockNotRecordedTitle: {
    id: 'component.Widget.stockNotRecordedTitle',
    defaultMessage: 'Stock not recorded (GenXpert only)',
  },
  stockNotRecordedDescription: {
    id: 'component.Widget.stockNotRecordedDescription',
    defaultMessage:
      "The stock not recorded is calculated by counting all sites that didn't enter any stock for any of the GeneXpert assays and dividing that number by the total number of sites.",
  },
  moduleSwapsTitle: {
    id: 'component.Widget.moduleSwapsTitle',
    defaultMessage: 'Module Swaps (GeneXpert only)',
  },
  moduleSwapsDescription: {
    id: 'component.Widget.moduleSwapsDescription',
    defaultMessage:
      'The number of GeneXpert module swaps made at the current month. The module swap issue appears when two consecutive results performed in the same slot have a different module serial number',
  },
  gxPositiveResultsNotifiedTitle: {
    id: 'component.Widget.gxPositiveResultsNotifiedTitle',
    defaultMessage: 'Positive Results Notified',
  },
  gxPositiveResultsNotifiedDescription: {
    id: 'component.Widget.gxPositiveResultsNotifiedDescription',
    defaultMessage: `The percentage of positive results that were notified via SMS or email.`,
  },
  avgTimeToUploadTitle: {
    id: 'component.Widget.avgTimeToUploadTitle',
    defaultMessage: 'Average Delay to Upload',
  },
  avgTimeToUploadDescription: {
    id: 'component.Widget.avgTimeToUploadDescription',
    defaultMessage:
      'The average delay of uploading results, in hours. Only considering results where the delay was greater than two hours.',
  },
  percentageOfModulesFunctioningTitle: {
    id: 'component.Widget.percentageOfModulesFunctioningTitle',
    defaultMessage: 'Percentage of Modules Functioning',
  },
  percentageOfModulesFunctioningDescription: {
    id: 'component.Widget.percentageOfModulesFunctioningDescription',
    defaultMessage:
      'Counts the percentage of module bays used in the last 7 days, based on the count of all available bays in all GeneXpert devices that were active in the last 7 days.',
  },
  averageRecipientsOfEmail: {
    id: 'component.Widget.averageRecipientsOfEmail',
    defaultMessage: 'Average email recipients per positive result',
  },
  averageRecipientsOfEmailDescription: {
    id: 'component.Widget.averageRecipientsOfEmailDescription',
    defaultMessage: 'The average number of email recipients per positive result.',
  },
  averageRecipientsOfSms: {
    id: 'component.Widget.averageRecipientsOfSms',
    defaultMessage: 'Average SMS recipients per positive result',
  },
  averageRecipientsOfSmsDescription: {
    id: 'component.Widget.averageRecipientsOfSmsDescription',
    defaultMessage: 'The average number of SMS recipients per positive result.',
  },
  averageLengthOfSms: {
    id: 'component.Widget.averageLengthOfSms',
    defaultMessage: 'Average length of SMS',
  },
  averageLengthOfSmsDescription: {
    id: 'component.Widget.averageLengthOfSmsDescription',
    defaultMessage: 'The average number of characters in SMS messages sent about positive results.',
  },
  dashboardWidgetSmsSentTitle: {
    id: 'component.Widget.dashboardWidgetSmsSentTitle',
    defaultMessage: 'SMS Sent MTD',
  },
  dashboardWidgetSmsSentDescription: {
    id: 'component.Widget.dashboardWidgetSmsSentDescription',
    defaultMessage: 'The total number of text messages sent in the month',
  },
  averageDaysModuleSwap: {
    id: 'component.Widget.averageDaysModuleSwap',
    defaultMessage: 'Average days between module swaps',
  },
  averageDaysModuleSwapDescription: {
    id: 'component.Widget.averageDaysModuleSwapDescription',
    defaultMessage:
      "The average number of days between the last result reported under a replaced module serial and the new module serial in that module slot reporting its first result. The module swap issue appears when two consecutive results performed in the same device's slot, they have a different module serial number",
  },
  averageTimeToModuleReplacementTitle: {
    id: 'component.Widget.averageTimeToModuleReplacementTitle',
    defaultMessage: 'Average time to replace disabled module',
  },
  averageTimeToModuleReplacementDescription: {
    id: 'component.Widget.averageTimeToModuleReplacementDescription',
    defaultMessage:
      'The average time (in days) between when a module was disabled and a different module serial being detected in the same slot.',
  },
  numberOfDevicesExperiencingServiceInterruptionTitle: {
    id: 'component.Widget.numberOfDevicesExperiencingServiceInterruptionTitle',
    defaultMessage: 'Devices With Service Interruption',
  },
  numberOfDevicesExperiencingServiceInterruptionDescription: {
    id: 'component.Widget.numberOfDevicesExperiencingServiceInterruptionDescription',
    defaultMessage:
      'The number of devices experiencing service interruption on this and the previous month. A device has a service interruption when it is flagged as "Down for repair" for it maintenance status.',
  },
  averageDurationServiceInterruptionTitle: {
    id: 'component.Widget.averageDurationServiceInterruptionTitle',
    defaultMessage: 'Average Duration of Service Interruption',
  },
  averageDurationServiceInterruptionDescription: {
    id: 'component.Widget.averageDurationServiceInterruptionDescription',
    defaultMessage:
      'The average duration of a service interruption, in days.  The period of interruption will be the date range between the device was flagged as "Down for repair" and when it back to be active again',
  },
  percentageOfDaysWithServiceInterruptionTitle: {
    id: 'component.Widget.percentageOfDaysWithServiceInterruptionTitle',
    defaultMessage: 'Days With Service Interruption',
  },
  percentageOfDaysWithServiceInterruptionDescription: {
    id: 'component.Widget.percentageOfDaysWithServiceInterruptionDescription',
    defaultMessage:
      'The percentage of "device-days" that were statused as "down for repair", excluding weekends. For example, 20 weekdays in the month and 5 devices would equate 100 "device-days". If one device was down half of the month, this number would be 10%',
  },
  dashboardWidgetTitleTotalDeaths: {
    id: 'component.Widget.dashboardWidgetTitleTotalDeaths',
    defaultMessage: 'Deaths',
  },
  dashboardWidgetDescriptionTotalDeaths: {
    id: 'component.Widget.dashboardWidgetDescriptionTotalDeaths',
    defaultMessage: 'The number of results that belong to a patient that died',
  },
  dashboardWidgetTitleConfirmedCases: {
    id: 'component.Widget.dashboardWidgetTitleConfirmedCases',
    defaultMessage: 'Confirmed cases',
  },
  confirmedCasesDescription: {
    id: 'component.Widget.confirmedCasesDescription',
    defaultMessage: 'The number of positive results',
  },
  dashboardWidgetTitleTotalActiveCases: {
    id: 'component.Widget.dashboardWidgetTitleTotalActiveCases',
    defaultMessage: 'Active cases',
  },
  totalActiveCasesDescription: {
    id: 'component.Widget.totalActiveCasesDescription',
    defaultMessage: 'The number of positive results that are still active',
  },
  dashboardWidgetTitleTotalRecoveredCases: {
    id: 'component.Widget.dashboardWidgetTitleTotalRecoveredCases',
    defaultMessage: 'Recovered cases',
  },
  totalRecoveredCasesDescription: {
    id: 'component.Widget.totalRecoveredCasesDescription',
    defaultMessage: 'The number of results that belong to a patient that recovered',
  },
  serverUptimeTitle: {
    id: 'component.Widget.serverUptimeTitle',
    defaultMessage: 'Server Uptime',
  },
  serverUptimeDescription: {
    id: 'component.Widget.serverUptimeDescription',
    defaultMessage: 'The average uptime of the Aspect server this month.',
  },
  deviceCalibrationPastDueTitle: {
    id: 'component.Widget.deviceCalibrationPastDueTitle',
    defaultMessage: 'GeneXpert Calibration Past Due',
  },
  deviceCalibrationPastDueDescription: {
    id: 'component.Widget.deviceCalibrationPastDueDescription',
    defaultMessage: 'The number of GeneXpert instruments that had their last calibration more than one year ago.',
  },
  deviceCalibratedWhenDueTitle: {
    id: 'component.Widget.deviceCalibratedWhenDueTitle',
    defaultMessage: 'GeneXpert Calibrated When Due',
  },
  deviceCalibratedWhenDueDescription: {
    id: 'component.Widget.deviceCalibratedWhenDueDescription',
    defaultMessage:
      'The percentage of GeneXpert calibrations that were within 30 days of the scheduled date. Note that this only counts calibrations for devices that had a calibration record before.',
  },
  unusedModulesTitle: {
    id: 'component.Widget.unusedModulesTitle',
    defaultMessage: 'Devices with Unused Modules',
  },
  unusedModulesDescription: {
    id: 'component.Widget.unusedModulesDescription',
    defaultMessage: `Counts devices that didn't use all available module bays for running the most recent 20 results. This can indicate a faulty module`,
  },
  unusedModulesStats: {
    id: 'component.Widget.unusedModulesStats',
    defaultMessage: '{unit} last month',
  },
  bangladeshAverageCompletionTitle: {
    id: 'component.Widget.bangladeshAverageCompletionTitle',
    defaultMessage: 'Custom Fields Average Completion',
  },
  bangladeshAverageCompletionDescription: {
    id: 'component.Widget.bangladeshAverageCompletionDescription',
    defaultMessage:
      "The average custom fields completion percent in the current month. The calculation is based on the comparative between the completed score of each result's custom fields and total score of the fields assigned to the assay",
  },
  activeDevicesCntTitle: {
    id: 'component.Widget.activeDevicesCntTitle',
    defaultMessage: 'Current Active Devices',
  },
  activeDevicesCntDescription: {
    id: 'component.Widget.activeDevicesCntDescription',
    defaultMessage:
      'Scoped to the last 24 hours, shows the number of devices that uploaded tests (Active), compared to the number of devices that pinged to Aspect (Online).',
  },
})

export default messages
