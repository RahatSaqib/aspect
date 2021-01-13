/**
 * WIP
 * key: 'string' [self defined]
 * label: 'string' [self defined]
 * width: 'number' [self defined]
 * disableHide: 'boolean' [react-table]
 * disableGroupBy: 'boolean' [react-table]
 * aggregate: 'function' [self defined|react-table]
 * Aggregated: 'function' [self defined]
 * format: 'react component' [self defined]
 */

import messages from './messages'
import tableMessages from '../../AspectTable/TableCell/messages'
import { timeClassification, totalItemCount } from '../../AspectTable/Helpers'
import ContactsCell from '../../AspectTable/TableCell/ContactsCell'
import { DateTimeCellFlagged } from '../../AspectTable/TableCell/DateTimeCell'
import NumberCell from '../../AspectTable/TableCell/NumberCell'
import NotificationsContextualMenu from './NotificationsContextualMenu'

const baseConfig = ({ formatMessage, formatNumber }) => ({
  name: 'notification',
  columns: [
    {
      key: 'lastTriggeredOn',
      label: formatMessage(messages.notificationsTableHeaderLastTriggered),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      aggregate: timeClassification,
      Aggregated: ({ value }) =>
        formatMessage(tableMessages.timeClassification, {
          elapsed: value[0],
          upcoming: value[1],
        }),
      format: DateTimeCellFlagged,
    },
    {
      key: 'name',
      label: formatMessage(messages.notificationsTableHeaderName),
      width: 35,
      disableHide: true,
      disableGroupBy: true,
      aggregate: 'count',
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableHeaderNameCount, {
          itemCount: formatNumber(value),
        })}`,
    },
    {
      key: 'totalTriggers',
      label: formatMessage(messages.notificationsTableHeaderTotalTriggers),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      aggregate: 'sum',
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableTotalTriggersCount, {
          itemCount: formatNumber(value),
        })}`,
      format: NumberCell,
    },
    {
      key: 'contacts',
      label: formatMessage(messages.notificationsTableHeaderContacts),
      disableHide: true,
      disableGroupBy: true,
      width: 25,
      aggregate: totalItemCount,
      Aggregated: ({ value }) =>
        `${formatMessage(messages.notificationsTableContactsCount, {
          itemCount: formatNumber(value),
        })}`,
      format: ContactsCell,
    },
  ],
  columnOrder: {
    allow: false,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
  contextualMenu: NotificationsContextualMenu,
})

export default baseConfig
