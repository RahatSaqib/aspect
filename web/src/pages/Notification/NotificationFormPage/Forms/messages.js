import { defineMessages } from 'react-intl'

// Define all messages for /notifications/validations
export default defineMessages({
  smsBodyRequired: {
    id: 'pages.Notifications.smsBodyRequired',
    defaultMessage: 'Sms body is required',
  },
  webBodyRequired: {
    id: 'pages.Notifications.webBodyRequired',
    defaultMessage: 'Web body is required',
  },
  webUrlRequired: {
    id: 'pages.Notifications.webUrlRequired',
    defaultMessage: 'Web url is required',
  },
  webUrlInvalidFormat: {
    id: 'pages.Notifications.webUrlInvalidFormat',
    defaultMessage: 'Web url has an invalid format',
  },
  emailBodyRequired: {
    id: 'pages.Notifications.emailBodyRequired',
    defaultMessage: 'Email body is required',
  },
  emailBodyMustContainDownloadLink: {
    id: 'pages.Notifications.emailBodyMustContainDownloadLink',
    defaultMessage: 'Email should contain download link for Report-based Notification',
  },
  emailSubjectRequired: {
    id: 'pages.Notifications.emailSubjectRequired',
    defaultMessage: 'Email subject is required',
  },
  notificationNameRequired: {
    id: 'pages.Notifications.notificationNameRequired',
    defaultMessage: 'The notification name is required',
  },
  resultCategoryRequired: {
    id: 'pages.Notifications.resultCategoryRequired',
    defaultMessage: 'You should select at least one Result Category for this assay',
  },
  assayRequired: {
    id: 'pages.Notifications.assayRequired',
    defaultMessage: 'At least one assay is required for result based notifications',
  },
  jobFunctionRequired: {
    id: 'pages.Notifications.jobFunctionRequired',
    defaultMessage: 'Should select at least one job function or individiual person for this notification',
  },
  personOrJobFunctionRequired: {
    id: 'pages.Notifications.personOrJobFunctionRequired',
    defaultMessage: 'Should select at least one job function or individiual person for this notification',
  },
  invalidWebhookUrl: {
    id: 'pages.Notifications.invalidWebhookUrl',
    defaultMessage: 'Invalid webhook url',
  },
  smsLength: {
    id: 'pages.Notifications.smsLength',
    defaultMessage: "Sms body shouldn't have no more than 144 characters",
  },
  geographyRequired: {
    id: 'pages.Notifications.geographyRequired',
    defaultMessage: 'You should select at least one option',
  },
  notificationChannels: {
    id: 'pages.Notifications.notificationChannels',
    defaultMessage: 'At least one of the notification channels should be selected',
  },
})
