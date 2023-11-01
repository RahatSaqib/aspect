import { defineMessages } from 'react-intl'

const messages = defineMessages({
  notificationsTableTotalTriggersCount: {
    id: 'pages.Notifications.notificationsTableTotalTriggersCount',
    defaultMessage: `{itemCount} (total)`,
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
  cancel: {
    id: 'pages.Notifications.table.cancel',
    defaultMessage: 'Cancel',
  },
  sentDetails: {
    id: 'pages.Notifications.table.sentDetails',
    defaultMessage: 'Sent details',
  },
  sentSuccessfully: {
    id: 'pages.Notifications.table.sentSuccessfully',
    defaultMessage: 'Successfully',
  },
  sentWithErrors: {
    id: 'pages.Notifications.table.sentWithErrors',
    defaultMessage: 'With errors',
  },
  sentPending: {
    id: 'pages.Notifications.table.sentPending',
    defaultMessage: 'Pending',
  },
  contactDetails: {
    id: 'pages.Notifications.table.contactDetails',
    defaultMessage: 'Contact Details',
  },
})

export default messages
