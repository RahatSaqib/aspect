import { getCustomMessage } from '../../../messages'
import messages from './messages'

export function getColumns(formatMessage, breakOutByLot, user) {
  return [
    ...(breakOutByLot ? [{ key: 'testEndedOn', label: formatMessage(messages.testEndedOn), sortable: true }] : []),
    { key: 'state', label: getCustomMessage(formatMessage, messages, 'state', user), sortable: true },
    { key: 'lga', label: getCustomMessage(formatMessage, messages, 'lga', user), sortable: true },
    { key: 'siteName', label: formatMessage(messages.siteName), sortable: true },
    { key: 'siteName', label: formatMessage(messages.consumable), sortable: true },
    ...(breakOutByLot ? [{ key: 'expiryDate', label: formatMessage(messages.expiryDate), sortable: true }] : []),
    ...(breakOutByLot ? [{ key: 'lotNumber', label: formatMessage(messages.lotNumber), sortable: true }] : []),
    { key: 'quantity', label: formatMessage(messages.unreconciledQuantity), sortable: true },
  ]
}
