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
import { DateTimeCell } from '../../../components/AspectTable/TableCell/DateTimeCell'
import { EmailCell, SMSCell, WebhookCell } from '../NotificationHistoryPage/ErrorCell/NotificationCells.jsx'
import messages from './messages'

const baseConfig = ({ formatMessage }) => {
  return {
    name: formatMessage(messages.event),
    namePlural: formatMessage(messages.events),
    columns: [
      {
        key: 'type',
        label: formatMessage(messages.notificationsTableHeaderType),
        width: 20,
        disableHide: true,
        disableGroupBy: true,
      },
      {
        key: 'category',
        label: formatMessage(messages.notificationsTableHeaderCategory),
        width: 20,
        disableHide: true,
        disableGroupBy: true,
      },
      {
        key: 'data',
        label: formatMessage(messages.notificationsTableHeaderData),
        width: 20,
        disableHide: true,
        disableGroupBy: true,
      },
      {
        key: 'createdOn',
        label: formatMessage(messages.createdOn),
        width: 20,
        disableHide: true,
        disableGroupBy: true,
        format: DateTimeCell,
      },
      {
        key: 'webhookSent',
        label: formatMessage(messages.eventsTableWebhookSent),
        width: 10,
        disableHide: true,
        disableGroupBy: true,
        format: WebhookCell,
      },
      {
        key: 'emailRecipients',
        label: formatMessage(messages.eventsTableHeaderEmailSent),
        width: 5,
        disableHide: true,
        disableGroupBy: true,
        format: EmailCell,
      },
      {
        key: 'smsRecipients',
        label: formatMessage(messages.eventsTableSmsSent),
        width: 5,
        disableHide: true,
        disableGroupBy: true,
        format: SMSCell,
      },
    ],
    columnOrder: {
      allow: false,
      initialOrder: ['name'],
      initialOrderDesc: true,
    },
  }
}
export default baseConfig
