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
    id: 'pages.OperationalData.totalPositiveResults',
    defaultMessage: 'Sent via SMS',
  },
  sentViaEmail: {
    id: 'pages.OperationalData.totalPositiveResults',
    defaultMessage: 'Sent via Email',
  },
  withinTwoHoursOfTesting: {
    id: 'pages.OperationalData.withinTwoHoursOfTesting',
    defaultMessage: 'Within 2 hours of testing',
  },
  // Widget sms sent this month

  dashboardWidgetSmsSentTitle: {
    id: 'pages.Status.dashboardWidgetSmsSentTitle',
    defaultMessage: 'Number of SMS Sent MTD',
  },
  dashboardWidgetSmsSentDescription: {
    id: 'pages.Status.dashboardWidgetSmsSentDescription',
    defaultMessage: 'The total number of text messages sent in the month',
  },

  averageTimeToModuleReplacementTitle: {
    id: 'pages.OperationalData.averageTimeToModuleReplacementTitle',
    defaultMessage: 'Average time to module replacement',
  },
  averageTimeToModuleReplacementDescription: {
    id: 'pages.OperationalData.averageTimeToModuleReplacementDescription',
    defaultMessage: `The average time (in days) between module replacement - i.e. 
      between day module serial was marked as disabled until a
      different module serial detected in that slot.`,
  },
})

export default messages
