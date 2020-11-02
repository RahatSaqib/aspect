/**
 * WIP
 * name: 'string'
 * columns: 'array'
 *  { key: 'string', label: 'string', disableSortBy: 'bool' [optional], width: 'number' [optional] }
 * columnOrder: { allow: 'bool', initialOrder: 'array' * required if allow === true },
 * hiddenColumns
 */

import messages from './messages'

const baseConfig = intl => ({
  name: 'notification',
  columns: [
    {
      key: 'lastTriggeredOn',
      label: intl.formatMessage(messages.notificationsTableHeaderLastTriggered),
      width: 20,
      disableHide: true,
    },
    {
      key: 'name',
      label: intl.formatMessage(messages.notificationsTableHeaderName),
      width: 35,
    },
    {
      key: 'totalTriggers',
      label: intl.formatMessage(messages.notificationsTableHeaderTotalTriggers),
      width: 20,
    },
    {
      key: 'contacts',
      label: intl.formatMessage(messages.notificationsTableHeaderContacts),
      disableSortBy: true,
      width: 25,
    },
  ],
  columnOrder: {
    allow: true,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
})

export default baseConfig
