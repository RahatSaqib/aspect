import { defineMessages } from 'react-intl'

export const messages = defineMessages({
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
})

export default messages
