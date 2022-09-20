import { defineMessages } from 'react-intl'

const messages = defineMessages({
  notificationsTitle: {
    id: 'pages.NotificationList.notificationsTitle',
    defaultMessage: 'Notifications History',
  },
  backButton: {
    id: 'pages.NotificationList.backButton',
    defaultMessage: 'Back',
  },
  event: {
    id: 'pages.Notifications.table.event',
    defaultMessage: 'event',
  },
  events: {
    id: 'pages.Notifications.table.events',
    defaultMessage: 'events',
  },
  eventsTableHeaderDate: {
    id: 'pages.Notifications.table.dateHeader',
    defaultMessage: 'Date',
  },
  sampleId: {
    id: 'pages.Notifications.table.sampleId',
    defaultMessage: 'Sample ID',
  },
  patientId: {
    id: 'pages.Notifications.table.patientId',
    defaultMessage: 'Patient ID',
  },
  eventsTableWebhookSent: {
    id: 'pages.Notifications.table.webhookSentHeader',
    defaultMessage: 'Webhook Sent',
  },
  eventsTableHeaderEmailSent: {
    id: 'pages.Notifications.table.emailSentHeader',
    defaultMessage: 'Email Sent',
  },
  eventsTableSmsSent: {
    id: 'pages.Notifications.table.smsSentHeader',
    defaultMessage: 'SMS Sent',
  },
})

export default messages
