/**
 * WIP
 * name: 'string'
 * columns: 'array'
 *  { key: 'string', label: 'string', disableSortBy: 'bool' [optional], width: 'number' [optional] }
 * columnOrder: { allow: 'bool', initialOrder: 'array' * required if allow === true },
 * hiddenColumns
 */

import messages from './messages'
import { timeClassification, totalItemCount } from '../../AspectTable/Helpers'
import ContactsCell from '../../AspectTable/TableCell/ContactsCell'
import { DateTimeCellFlagged } from '../../AspectTable/TableCell/DateTimeCell'
import NumberCell from '../../AspectTable/TableCell/NumberCell'

const baseConfig = ({ formatMessage }) => ({
  name: 'notification',
  columns: [
    {
      key: 'lastTriggeredOn',
      label: formatMessage(messages.notificationsTableHeaderLastTriggered),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      aggregate: timeClassification,
      Aggregated: ({ value }) => `${value}`,
      format: DateTimeCellFlagged,
    },
    {
      key: 'name',
      label: formatMessage(messages.notificationsTableHeaderName),
      width: 35,
      aggregate: 'count',
      Aggregated: ({ value }) => `${value} Names`,
    },
    {
      key: 'totalTriggers',
      label: formatMessage(messages.notificationsTableHeaderTotalTriggers),
      width: 20,
      aggregate: 'sum',
      disableGroupBy: true,
      Aggregated: ({ value }) => `${value} (total)`,
      format: NumberCell,
    },
    {
      key: 'contacts',
      label: formatMessage(messages.notificationsTableHeaderContacts),
      disableSortBy: true,
      width: 25,
      aggregate: totalItemCount,
      Aggregated: ({ value }) => `${value} Contacts`,
      format: ContactsCell,
    },
  ],
  columnOrder: {
    allow: true,
    initialOrder: ['name', 'lastTriggeredOn', 'totalTriggers', 'contacts'],
  },
})

export default baseConfig
