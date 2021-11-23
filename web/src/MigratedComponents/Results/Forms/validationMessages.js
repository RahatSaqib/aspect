import { defineMessages } from 'react-intl'

// Define all messages for Result Edit form validations
export default defineMessages({
  siteRequired: {
    id: 'pages.Result.siteRequired',
    defaultMessage: 'Site is required',
  },
  deviceRequired: {
    id: 'pages.Result.deviceRequired',
    defaultMessage: 'Device is required',
  },
  assayRequired: {
    id: 'pages.Result.assayRequired',
    defaultMessage: 'Assay is required',
  },
  startedOnRequired: {
    id: 'pages.Result.startedOnRequired',
    defaultMessage: 'Start date is required',
  },
  endedOnRequired: {
    id: 'pages.Result.endedOnRequired',
    defaultMessage: 'End date is required',
  },
  endedOnCannotBeBeforeStartedOn: {
    id: 'pages.Result.endedOnCannotBeBeforeStartedOn',
    defaultMessage: 'End time cannot be before start time',
  },
  timeCannotBeGreaterThanNow: {
    id: 'pages.Result.timeCannotBeGreaterThanNow',
    defaultMessage: 'Time cannot be greater than current time',
  },
  resultCategory1: {
    id: 'pages.Result.resultCategory1',
    defaultMessage: 'Field is required',
  },
})
