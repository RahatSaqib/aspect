import fetchWrapperForQueries from '../../../components/QueryFetch'
import { getCustomMessage } from '../../../messages'
import messages from './messages'

export function getColumns(formatMessage, { breakOutByLot, requireLotNumber, requireExpirationDate, user }) {
  return [
    { key: 'stateName', label: getCustomMessage(formatMessage, messages, 'state', user), sortable: true },
    { key: 'lgaName', label: getCustomMessage(formatMessage, messages, 'lga', user), sortable: true },
    { key: 'siteName', label: formatMessage(messages.siteName), sortable: true },
    { key: 'consumableName', label: formatMessage(messages.consumable), sortable: true },
    {
      key: 'expiresOn',
      label: formatMessage(messages.expiryDate),
      sortable: false,
      isHidden: !(breakOutByLot && requireExpirationDate),
    },
    {
      key: 'lotNumber',
      label: formatMessage(messages.lotNumber),
      sortable: false,
      isHidden: !(breakOutByLot && requireLotNumber),
    },
    { key: 'quantity', label: formatMessage(messages.unreconciledQuantity), sortable: true },
  ]
}

export async function getExportableFile(filters, fileFormat, sortCol, sortDir, size, reportName) {
  const elem = await fetchWrapperForQueries({
    endpoint: '/inventory/reconciliation/export',
    params: { sortCol, sortDir, format: fileFormat, size, ...filters },
  })

  return { elem, fileFormat, reportName }
}
