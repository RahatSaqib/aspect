import { defineMessages } from 'react-intl'

export const messages = defineMessages({
  notificationsTableName: {
    id: 'pages.Notifications.table.notificationsTableName',
    defaultMessage: 'notification',
  },
  notificationsTableNamePlural: {
    id: 'pages.Notifications.table.notificationsTableNamePlural',
    defaultMessage: 'notifications',
  },
  notificationsTableHeaderName: {
    id: 'pages.Notifications.table.nameHeader',
    defaultMessage: 'Name',
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
  notificationsTableHeaderLastTriggered: {
    id: 'pages.Notifications.table.lastTriggeredHeader',
    defaultMessage: 'Last Triggered',
  },
  notificationsTableHeaderTotalTriggers: {
    id: 'pages.Notifications.table.totalTriggersHeader',
    defaultMessage: 'Total Triggers',
  },
  notificationsTableTotalTriggersCount: {
    id: 'pages.Notifications.notificationsTableTotalTriggersCount',
    defaultMessage: `{itemCount} (total)`,
  },
  notificationsTableHeaderContacts: {
    id: 'pages.Notifications.table.contactsHeader',
    defaultMessage: 'Contacts',
  },
  notificationsTableContactsCount: {
    id: 'pages.Notifications.notificationsTableContactsCount',
    defaultMessage: `{itemCount, plural,
      one {# Contact}
      other {# Contacts}
    }`,
  },

  notificationCreateGroupForResults: {
    id: 'pages.Notifications.table.createButton.group.forResults',
    defaultMessage: 'Notification for Results',
  },
  notificationCreateGroupForDevices: {
    id: 'pages.Notifications.table.createButton.group.forDevices',
    defaultMessage: 'Notification for Devices',
  },

  // Notification for Results
  notificationTypeResultBased: {
    id: 'pages.Notification.type.ResultBased',
    defaultMessage: 'Result Based',
  },
  notificationTypeTestUpdated: {
    id: 'pages.Notification.type.TestUpdated',
    defaultMessage: 'Test Updated',
  },
  // Notification for Devices
  notificationTypeOffline: {
    id: 'pages.Notification.type.Offline',
    defaultMessage: 'Offline',
  },
  notificationTypeReport: {
    id: 'pages.Notification.type.Report',
    defaultMessage: 'Report',
  },
  notificationTypeLowInventory: {
    id: 'pages.Notification.type.LowInventory',
    defaultMessage: 'Low Inventory',
  },
  notificationTypeCalibration: {
    id: 'pages.Notification.type.Calibration',
    defaultMessage: 'Calibration',
  },
  notificationTypeModule: {
    id: 'pages.Notification.type.Module',
    defaultMessage: 'Module',
  },
  notificationTypeCriticalError: {
    id: 'pages.Notification.type.CriticalError',
    defaultMessage: 'Critical Error',
  },
  notificationTypeOnlineDate: {
    id: 'pages.Notification.type.OnlineDate',
    defaultMessage: 'Online Date',
  },
})

export default messages
