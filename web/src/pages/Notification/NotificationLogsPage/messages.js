import { defineMessages } from 'react-intl'

const messages = defineMessages({
  createNotification: {
    id: 'pages.NotificationList.createNotification',
    defaultMessage: 'Create Notification',
  },
  notificationLogs: {
    id: 'pages.NotificationList.notificationLogs',
    defaultMessage: 'Notification Logs',
  },
  notificationsTableHeaderType: {
    id: 'pages.Notifications.table.notificationsTableHeaderType',
    defaultMessage: 'Type',
  },
  notificationsTableHeaderNameCount: {
    id: 'pages.Notifications.notificationsTableHeaderNameCount',
    defaultMessage: `{itemCount, plural,
      one {# Name}
      other {# Names}
    }`,
  },
  notificationsTableHeaderCategory: {
    id: 'pages.Notifications.table.categoryHeader',
    defaultMessage: 'Category',
  },
  notificationsTableHeaderData: {
    id: 'pages.Notifications.table.notificationsTableHeaderData',
    defaultMessage: 'Data',
  },
  notificationsTableHeaderEmail: {
    id: 'pages.Notifications.table.emailHeader',
    defaultMessage: 'Email',
  },
  notificationsTableHeaderSms: {
    id: 'pages.Notifications.table.smsHeader',
    defaultMessage: 'SMS',
  },
  notificationsTableHeaderWebhook: {
    id: 'pages.Notifications.table.notificationsTableHeaderWebHook',
    defaultMessage: 'Web Hook',
  },
  notificationsTableContactsCount: {
    id: 'pages.Notifications.notificationsTableContactsCount',
    defaultMessage: `{itemCount, plural,
      one {# Contact}
      other {# Contacts}
    }`,
  },
  notificationsTableJobFunctionsCount: {
    id: 'pages.Notifications.notificationsTableJobFunctionsCount',
    defaultMessage: `{itemCount, plural,
      one {# Job Function}
      other {# Job Functions}
    }`,
  },
  notificationsTableJobFunctionsCountPersons: {
    id: 'pages.Notifications.notificationsTableJobFunctionsCountPersons',
    defaultMessage: `{itemCount, plural,
      one {# Person}
      other {# Persons}
    }`,
  },
  yes: {
    id: 'pages.Notifications.table.createButton.group.yes',
    defaultMessage: 'Yes',
  },
  no: {
    id: 'pages.Notifications.table.createButton.group.no',
    defaultMessage: 'No',
  },
  createdOn: {
    id: 'pages.Notifications.table.createButton.group.createdOn',
    defaultMessage: 'Created On',
  },
  notificationCreateGroupForResults: {
    id: 'pages.Notifications.table.createButton.group.forResults',
    defaultMessage: 'Notification for Results',
  },
  notificationCreateGroupForDevices: {
    id: 'pages.Notifications.table.createButton.group.forDevices',
    defaultMessage: 'Notification for Devices',
  },
  status: {
    id: 'pages.Notification.status',
    defaultMessage: 'Status',
  },
  paginatorStatus: {
    id: 'pages.Notification.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# notification}
      other {# notifications}
    }`,
  },

  // values for notifications list
  issueBased: {
    id: 'pages.TableCell.issueBasedNotification',
    defaultMessage: 'Issue Based',
  },
  resultBased: {
    id: 'pages.TableCell.resultBasedNotification',
    defaultMessage: 'Result Based',
  },
  reportBased: {
    id: 'pages.TableCell.reportBasedNotification',
    defaultMessage: 'Report Based',
  },
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
