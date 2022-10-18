import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  resultsTransmittedTitle: {
    id: 'pages.OperationalData.resultsTransmittedTitle',
    defaultMessage: 'Positive Test Results Transmitted',
  },
  assayName: {
    id: 'pages.OperationalDataPie.assayName',
    defaultMessage: ' ',
  },
  cntAll: {
    id: 'pages.OperationalData.cntAll',
    defaultMessage: 'Total Results',
  },
  cntPositive: {
    id: 'pages.OperationalData.cntPositive',
    defaultMessage: 'Positives',
  },
  percentPositive: {
    id: 'pages.OperationalData.percentPositive',
    defaultMessage: 'Percent Positive',
  },
  percentReported: {
    id: 'pages.OperationalData.percentReported',
    defaultMessage: 'Percent Reported',
  },
  percentViaSms: {
    id: 'pages.OperationalData.percentViaSms',
    defaultMessage: 'Sent via SMS',
  },
  percentViaEmail: {
    id: 'pages.OperationalData.percentViaEmail',
    defaultMessage: 'Sent via Email',
  },
  percentViaSmsDescription: {
    id: 'pages.OperationalData.percentViaSmsDescription',
    defaultMessage: 'The percentage of reported results that were reported via SMS.',
  },
  percentViaEmailDescription: {
    id: 'pages.OperationalData.percentViaEmailDescription',
    defaultMessage: 'The percentage of reported results that were reported via Email.',
  },
  percentWithin2HoursDescription: {
    id: 'pages.OperationalData.percentWithin2HoursDescription',
    defaultMessage: 'The percentage of positive results that were reported within two hours of test completion.',
  },
  percentReportedDescription: {
    id: 'pages.OperationalData.percentReportedDescription',
    defaultMessage: 'The percentage of positive results that were reported via Email or SMS.',
  },
  percentWithin2Hours: {
    id: 'pages.OperationalData.percentWithin2Hours',
    defaultMessage: 'Within 2 hours of testing',
  },
})

export default messages
