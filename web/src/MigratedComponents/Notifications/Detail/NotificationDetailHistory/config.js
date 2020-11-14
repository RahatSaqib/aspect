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
import ContactsCell from '../../../AspectTable/TableCell/ContactsCell'
import NumberCell from '../../../AspectTable/TableCell/NumberCell'

const baseConfig = ({ formatMessage }) => ({
  name: 'notification',
  columns: [
    {
      key: 'lastTriggeredOn',
      label: formatMessage(messages.notificationsTableHeaderLastTriggered),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      disableOrderBy: true,
    },
    {
      key: 'name',
      label: formatMessage(messages.notificationsTableHeaderName),
      width: 35,
      disableHide: true,
      disableGroupBy: true,
      disableOrderBy: true,
    },
    {
      key: 'totalTriggers',
      label: formatMessage(messages.notificationsTableHeaderTotalTriggers),
      width: 20,
      aggregate: 'sum',
      disableHide: true,
      disableGroupBy: true,
      disableOrderBy: true,
      format: NumberCell,
    },
    {
      key: 'contacts',
      label: formatMessage(messages.notificationsTableHeaderContacts),
      disableHide: true,
      disableGroupBy: true,
      disableOrderBy: true,
      width: 25,
      format: ContactsCell,
    },
  ],
  columnOrder: {
    allow: true,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
})

export default baseConfig
