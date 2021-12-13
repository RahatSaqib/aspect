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
})

export default messages
