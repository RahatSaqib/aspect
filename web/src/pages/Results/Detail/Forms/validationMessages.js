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
  collectedOnRequired: {
    id: 'pages.Result.collectedOnRequired',
    defaultMessage: 'CollectedOn date is required',
  },
  startedOnCannotBeAfterEndedOn: {
    id: 'pages.Result.startedOnCannotBeAfterEndedOn',
    defaultMessage: 'Start time cannot be after End time',
  },
  endedOnCannotBeBeforeStartedOn: {
    id: 'pages.Result.endedOnCannotBeBeforeStartedOn',
    defaultMessage: 'End time cannot be before Start time',
  },
  timeCannotBeGreaterThanNow: {
    id: 'pages.Result.timeCannotBeGreaterThanNow',
    defaultMessage: 'Time cannot be greater than current time',
  },
  resultCategory1: {
    id: 'pages.Result.resultCategory1',
    defaultMessage: 'Field is required',
  },
  resultTypeIdRequired: {
    id: 'pages.Result.resultTypeId',
    defaultMessage: 'Exclude reason is required',
  },
  errorCode: {
    id: 'pages.Result.errorCode',
    defaultMessage: 'Error Code must be a positive integer with max 5 digits',
  },
})
