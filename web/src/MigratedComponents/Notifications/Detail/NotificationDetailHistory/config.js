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
import { DateTimeCell } from '../../../AspectTable/TableCell/DateTimeCell'
import NumberCell from '../../../AspectTable/TableCell/NumberCell'

const baseConfig = ({ formatMessage }) => ({
  name: formatMessage(messages.event),
  namePlural: formatMessage(messages.events),
  columns: [
    {
      key: 'date',
      label: formatMessage(messages.eventsTableHeaderDate),
      width: 40,
      disableHide: true,
      disableGroupBy: true,
      format: DateTimeCell,
    },
    {
      key: 'webhookSent',
      label: formatMessage(messages.eventsTableWebhookSent),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      format: NumberCell,
    },
    {
      key: 'emailSent',
      label: formatMessage(messages.eventsTableHeaderEmailSent),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      format: NumberCell,
    },
    {
      key: 'smsSent',
      label: formatMessage(messages.eventsTableSmsSent),
      width: 20,
      disableHide: true,
      disableGroupBy: true,
      format: NumberCell,
    },
  ],
  columnOrder: {
    allow: false,
    initialOrder: ['date'],
    initialOrderDesc: true,
  },
})

export default baseConfig
