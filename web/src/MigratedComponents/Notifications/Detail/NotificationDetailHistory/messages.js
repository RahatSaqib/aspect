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
})

export default messages
