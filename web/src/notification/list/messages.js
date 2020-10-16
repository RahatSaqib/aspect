import { defineMessages } from 'react-intl'

const messages = defineMessages({
  notificationsTitle: {
    id: 'pages.NotificationList.title',
    defaultMessage: 'Notifications',
  },
  notificationsName: {
    id: 'pages.NotificationList.name',
    defaultMessage: 'Name',
  },
  lastTriggered: {
    id: 'pages.NotificationList.lastTriggered',
    defaultMessage: 'Last triggered',
  },
  totalTriggers: {
    id: 'pages.NotificationList.totalTriggers',
    defaultMessage: 'Total triggers',
  },
  contacts: {
    id: 'pages.NotificationList.contacts',
    defaultMessage: 'Contacts',
  },
  paginatorStatus: {
    id: 'pages.NotificationList.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
        one {# notification}
        other {# notifications}
      }`,
  },
})

export default messages
