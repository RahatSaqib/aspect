import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  welcome: {
    id: 'pages.Status.welcome',
    defaultMessage: 'welcome {userName}',
  },
  last30Days: {
    id: 'pages.Status.last30Days',
    defaultMessage: 'last 30 days',
  },
  sitesTitle: {
    id: 'pages.Status.sitesTitle',
    defaultMessage: 'sites',
  },
  devicesTitle: {
    id: 'pages.Status.devicesTitle',
    defaultMessage: 'devices',
  },
  resultsTitle: {
    id: 'pages.Status.resultsTitle',
    defaultMessage: 'results',
  },
  personTitle: {
    id: 'pages.Status.personTitle',
    defaultMessage: 'users',
  },
  clinicalTitle: {
    id: 'pages.Status.clinicalTitle',
    defaultMessage: 'clinical',
  },
  consumableTitle: {
    id: 'pages.Status.consumableTitle',
    defaultMessage: 'consumables',
  },
  summaryOperationalDevicesTitle: {
    id: 'pages.Status.summaryOperationalDevicesTitle',
    defaultMessage: 'operational devices',
  },
  summaryWarrantyExpiringTitle: {
    id: 'pages.Status.summaryWarrantyExpiringTitle',
    defaultMessage: 'warranty expiring',
  },
  summaryCalibrationTitle: {
    id: 'pages.Status.summaryCalibrationTitle',
    defaultMessage: 'calibration',
  },
  summaryUploadingDataTitle: {
    id: 'pages.Status.summaryUploadingDataTitle',
    defaultMessage: 'uploading data',
  },
  summaryTestFailuresTitle: {
    id: 'pages.Status.summaryTestFailuresTitle',
    defaultMessage: 'test failures',
  },
  summaryOnlineNowTitle: {
    id: 'pages.Status.summaryOnlineNowTitle',
    defaultMessage: 'online now',
  },
  summaryStockManagementTitle: {
    id: 'pages.Status.summaryStockManagementTitle',
    defaultMessage: 'stock management',
  },
  summaryDeviceManagementTitle: {
    id: 'pages.Status.summaryDeviceManagementTitle',
    defaultMessage: 'device management',
  },
  summaryTestQualityTitle: {
    id: 'pages.Status.summaryTestQualityTitle',
    defaultMessage: 'test quality',
  },
  summaryMedicoTBTitle: {
    id: 'pages.Status.summaryMedicoTBTitle',
    defaultMessage: 'medico TB',
  },
  summaryHealthPlusHIVTBTitle: {
    id: 'pages.Status.summaryHealthPlusHIVTBTitle',
    defaultMessage: 'health Plus HIV TB',
  },
  receiveConsumablesLabel: {
    id: 'pages.Status.receiveConsumablesLabel',
    defaultMessage: 'receive Consumables',
  },
  discardConsumablesLabel: {
    id: 'pages.Status.discardConsumablesLabel',
    defaultMessage: 'discard Consumables',
  },
  manageConsumablesLabel: {
    id: 'pages.Status.manageConsumablesLabel',
    defaultMessage: 'manage Consumables',
  },
  runningLowStatus: {
    id: 'pages.Status.runningLowStatus',
    defaultMessage: 'running low',
  },
  expiringStockStatus: {
    id: 'pages.Status.expiringStockStatus',
    defaultMessage: 'expiring stock',
  },
  fullyOperationalStatus: {
    id: 'pages.Status.fullyOperationalStatus',
    defaultMessage: 'fully operational',
  },
  warrantyExpiringStatus: {
    id: 'pages.Status.warrantyExpiringStatus',
    defaultMessage: 'warranty expiring',
  },
  needCalibrationStatus: {
    id: 'pages.Status.needCalibrationStatus',
    defaultMessage: 'need calibration',
  },
  notReportingStatus: {
    id: 'pages.Status.notReportingStatus',
    defaultMessage: 'not reporting',
  },
  highFailuresRatesStatus: {
    id: 'pages.Status.highFailuresRatesStatus',
    defaultMessage: 'high failures rates',
  },
  reportingStatus: {
    id: 'pages.Status.reportingStatus',
    defaultMessage: 'reporting',
  },
  withStockIssues: {
    id: 'pages.Status.withStockIssues',
    defaultMessage: 'with stock issues',
  },
  withDeviceIssues: {
    id: 'pages.Status.withDeviceIssues',
    defaultMessage: 'with device issues',
  },
  withQualityIssues: {
    id: 'pages.Status.withQualityIssues',
    defaultMessage: 'with quality issues',
  },
  ofTotalDevicesTitle: {
    id: 'pages.Status.ofTotalDevicesTitle',
    defaultMessage: 'of {total} devices',
  },
  ofTotalSitesTitle: {
    id: 'pages.Status.ofTotalSitesTitle',
    defaultMessage: 'of {total} sites',
  },
  subResultsTitle: {
    id: 'pages.Status.subResultsTitle',
    defaultMessage: 'Last 30 Days',
  },
  targetsTitle: {
    id: 'pages.Status.targetsTitle',
    defaultMessage: 'Regional Progress Indicators',
  },
  thisYear: {
    id: 'pages.Status.thisYear',
    defaultMessage: 'This Year',
  },
  lastYear: {
    id: 'pages.Status.lastYear',
    defaultMessage: 'Last Year',
  },
  thisQuarter: {
    id: 'pages.Status.thisQuarter',
    defaultMessage: 'This Quarter',
  },
  lastQuarter: {
    id: 'pages.Status.lastQuarter',
    defaultMessage: 'Last Quarter',
  },
  thisMonth: {
    id: 'pages.Status.thisMonth',
    defaultMessage: 'This Month',
  },
  lastMonth: {
    id: 'pages.Status.lastMonth',
    defaultMessage: 'Last Month',
  },
  targetLabel: {
    id: 'pages.Status.targetLabel',
    defaultMessage: 'Target:',
  },
  targetProgressLabel: {
    id: 'pages.Status.targetProgressLabel',
    defaultMessage: 'Progress:',
  },
  targetErrorMessageLabel: {
    id: 'pages.Status.targetErrorMessageLabel',
    defaultMessage: 'Patient Data Collection {dataCollection}',
  },
  actionTitle: {
    id: 'pages.Status.actionTitle',
    defaultMessage: 'Actions',
  },
  issueCategoryDeviceHealth: {
    id: 'pages.Status.issueCategoryDeviceHealth',
    defaultMessage: 'GeneXpert',
  },
  issueCategoryReagentHealth: {
    id: 'pages.Status.issueCategoryReagentHealth',
    defaultMessage: 'Reagents',
  },
  issueCategoryDataHealth: {
    id: 'pages.Status.issueCategoryDataHealth',
    defaultMessage: 'Patient Data',
  },
  issueCategoryConnectivityHealth: {
    id: 'pages.Status.issueCategoryConnectivityHealth',
    defaultMessage: 'Connection',
  },
  actionCount: {
    id: 'pages.Status.actionCount',
    defaultMessage: `{actionCount, plural, one {# Action} other {# Actions}}`,
  },
  actionStatus: {
    id: 'pages.Status.actionStatus',
    defaultMessage: 'Status',
  },
  actionLab: {
    id: 'pages.Status.actionLab',
    defaultMessage: 'Lab',
  },
  actionDevice: {
    id: 'pages.Status.actionDevice',
    defaultMessage: 'Device',
  },
  actionIssue: {
    id: 'pages.Status.actionIssue',
    defaultMessage: 'Issue',
  },
  acknowledged: {
    id: 'pages.Status.acknowledged',
    defaultMessage: 'Acknowledged',
  },
  acknowledge: {
    id: 'pages.Status.acknowledge',
    defaultMessage: 'Acknowledge',
  },
  update: {
    id: 'pages.Status.update',
    defaultMessage: 'Update',
  },
  updateStockLevel: {
    id: 'pages.Status.updateStockLevel',
    defaultMessage: 'UPDATE STOCK LEVEL:',
  },
  stockLevel: {
    id: 'pages.Status.stockLevel',
    defaultMessage: 'STOCK LEVEL:',
  },
  noActionsTitle: {
    id: 'pages.Status.noActionsTitle',
    defaultMessage: 'There are no waiting actions!',
  },
  stockLevelUpdatedSuccessfully: {
    id: 'pages.Status.stockLevelUpdatedSuccessfully',
    defaultMessage: 'Stock levels have been updated successfully',
  },
  issueAcknowledgedSuccessfully: {
    id: 'pages.Status.issueAcknowledgedSuccessfully',
    defaultMessage: 'The issue has been acknowledged successfully',
  },
  reportsTitle: {
    id: 'pages.Status.reportsTitle',
    defaultMessage: 'Reports',
  },
  downloadReport: {
    id: 'pages.Status.downloadReport',
    defaultMessage: 'Download Report',
  },
})

export default messages
