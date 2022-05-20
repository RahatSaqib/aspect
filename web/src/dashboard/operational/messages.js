import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  stockOutsTitle: {
    id: 'pages.OperationalData.stockOutsTitle',
    defaultMessage: 'stock outs',
  },
  expiringTitle: {
    id: 'pages.OperationalData.expiringTitle',
    defaultMessage: 'expiring',
  },
  siteWithProblems: {
    id: 'pages.OperationalData.siteWithProblems',
    defaultMessage: '{count} site with problems',
  },
  daysUnavailable: {
    id: 'pages.OperationalData.daysUnavailable',
    defaultMessage: 'days unavailable',
  },
  testFailures: {
    id: 'pages.OperationalData.testFailures',
    defaultMessage: 'test failures',
  },
  calibrationCompliance: {
    id: 'pages.OperationalData.calibrationCompliance',
    defaultMessage: 'calibration compliance',
  },
  deviceWithProblems: {
    id: 'pages.OperationalData.deviceWithProblems',
    defaultMessage: '{count} device with problems',
  },
  deviceCalibrationsUpToDate: {
    id: 'pages.OperationalData.deviceCalibrationsUpToDate',
    defaultMessage: 'All device calibrations up to date',
  },
  numberOfDevicesExperiencingServiceInterruptionTitle: {
    id: 'pages.OperationalData.numberOfDevicesExperiencingServiceInterruptionTitle',
    defaultMessage: 'Devices Experiencing Service Interruption',
  },
  numberOfDevicesExperiencingServiceInterruptionDescription: {
    id: 'pages.OperationalData.numberOfDevicesExperiencingServiceInterruptionDescription',
    defaultMessage:
      'The number of devices experiencing service interruption on this and the previous month. A device has a service interruption when it is flagged as "Down for repair" for it maintenance status.',
  },
  averageDurationServiceInterruptionTitle: {
    id: 'pages.OperationalData.averageDurationServiceInterruptionTitle',
    defaultMessage: 'Average Duration of Service Interruption',
  },
  averageDurationServiceInterruptionDescription: {
    id: 'pages.OperationalData.averageDurationServiceInterruptionDescription',
    defaultMessage:
      'The average duration of a service interruption, in days. The period of interruption will be the date range between the device was flagged as "Down for repair" and when it back to be active again',
  },
  resultsTransmittedTitle: {
    id: 'pages.OperationalData.resultsTransmittedTitle',
    defaultMessage: 'Positive Test Results Transmitted',
  },
  assayName: {
    id: 'pages.OperationalData.assayName',
    defaultMessage: 'Assay Name',
  },
  totalResults: {
    id: 'pages.OperationalData.totalResults',
    defaultMessage: 'Total Results',
  },
  totalPositiveResults: {
    id: 'pages.OperationalData.totalPositiveResults',
    defaultMessage: 'Positives',
  },
  percentPositiveResults: {
    id: 'pages.OperationalData.percentPositiveResults',
    defaultMessage: 'Percent Positive',
  },
  percentReported: {
    id: 'pages.OperationalData.percentReported',
    defaultMessage: 'Percent Reported',
  },
  sentViaSms: {
    id: 'pages.OperationalData.sentViaSms',
    defaultMessage: 'Sent via SMS',
  },
  sentViaEmail: {
    id: 'pages.OperationalData.sentViaEmail',
    defaultMessage: 'Sent via Email',
  },
  averageDaysForInstrumentReplacement: {
    id: 'pages.OperationalData.instrumentsReplaced',
    defaultMessage: 'Days for Instrument Replacement',
  },
  withinTwoHoursOfTesting: {
    id: 'pages.OperationalData.withinTwoHoursOfTesting',
    defaultMessage: 'Within 2 hours of testing',
  },
  // Widget sms sent this month

  dashboardWidgetSmsSentTitle: {
    id: 'pages.Status.dashboardWidgetSmsSentTitle',
    defaultMessage: 'SMS Sent MTD',
  },
  dashboardWidgetSmsSentDescription: {
    id: 'pages.Status.dashboardWidgetSmsSentDescription',
    defaultMessage: 'The total number of text messages sent in the month',
  },

  averageTimeToModuleReplacementTitle: {
    id: 'pages.OperationalData.averageTimeToModuleReplacementTitle',
    defaultMessage: 'Average time to replace disabled module',
  },
  averageTimeToModuleReplacementDescription: {
    id: 'pages.OperationalData.averageTimeToModuleReplacementDescription',
    defaultMessage: `The average time (in days) between when a module was disabled and a different module serial being detected in the same slot.`,
  },
  percentageOfDaysWithServiceInterruptionTitle: {
    id: 'pages.OperationalData.percentageOfDaysWithServiceInterruptionTitle',
    defaultMessage: 'Percentage of Days with Service Interruption',
  },
  percentageOfDaysWithServiceInterruptionDescription: {
    id: 'pages.OperationalData.percentageOfDaysWithServiceInterruptionDescription',
    defaultMessage:
      'The percentage of "device-days" that were statused as "down for repair", excluding weekends. For example, 20 weekdays in the month and 5 devices would equate 100 "device-days". If one device was down half of the month, this number would be 10%. A device has a service interruption when it is flagged as "Down for repair" for it maintenance status.',
  },
})

export default messages
