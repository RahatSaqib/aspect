import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  eventsTableWebhookSent: {
    id: 'pages.Notifications.table.webhookSentHeader',
    defaultMessage: 'Webhook Sent',
  },
  eventsTableHeaderDate: {
    id: 'pages.Notifications.table.dateHeader',
    defaultMessage: 'Date',
  },
  eventsTableHeaderEmailSent: {
    id: 'pages.Notifications.table.emailSentHeader',
    defaultMessage: 'Email Sent',
  },
  notificationsTableTotalTriggersCount: {
    id: 'pages.Notifications.notificationsTableTotalTriggersCount',
    defaultMessage: `{itemCount} (total)`,
  },
  eventsTableSmsSent: {
    id: 'pages.Notifications.table.smsSentHeader',
    defaultMessage: 'SMS Sent',
  },
  event: {
    id: 'pages.Notifications.table.event',
    defaultMessage: 'event',
  },
  events: {
    id: 'pages.Notifications.table.events',
    defaultMessage: 'events',
  },
  sampleId: {
    id: 'pages.Notifications.table.sampleId',
    defaultMessage: 'Sample ID',
  },
  patientId: {
    id: 'pages.Notifications.table.patientId',
    defaultMessage: 'Patient ID',
  },
  recipients: {
    id: 'pages.Notifications.table.recipients',
    defaultMessage: 'Recipients',
  },
  emailSentTo: {
    id: 'pages.Notifications.table.emailSentTo',
    defaultMessage: 'Email was sent to:',
  },
  smsSentTo: {
    id: 'pages.Notifications.table.smsSentTo',
    defaultMessage: 'SMS was sent to:',
  },
})

export default messages
