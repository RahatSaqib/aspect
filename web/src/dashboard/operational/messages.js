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
})

export default messages
