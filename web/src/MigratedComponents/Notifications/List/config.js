/**
 * name: 'string' [self defined, required]
 * columns: 'array' [self-defined, required]
 *  key: 'string' [self defined, required]
 *  filterKey: 'string' [self defined, optional for filtering]
 *  label: 'string' [self defined, required]
 *  width: 'number' [self defined, optional]
 *  disableHide: 'boolean' [react-table, optional default false]
 *  disableGroupBy: 'boolean' [react-table, optional default false]
 *  disableSortBy: 'boolean' [react-table, optional default false]
 *  aggregate: 'function' [self defined|react-table, optional for calcs]
 *  Aggregated: 'function' [self defined, optional for calcs]
 *  format: 'function|react component' [self defined, optional for calcs]
 * columnOrder: 'object' [self defined, optional]
 *  allow: 'bool' [self defined, optional default true]
 *  initialOrder: 'array' [self defined, optional]
 * contextualMenu: 'function|component' [self defined, optional]
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
      filterKey: 'notificationName',
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
