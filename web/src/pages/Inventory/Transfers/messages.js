import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../../messages/customMessages'

export const messages = defineMessages({
  ...commonDefinitions,
  InventoryTransferTitle: {
    id: 'pages.InventoryTransfer.InventoryTransferTitle',
    defaultMessage: 'Inventory Transfer',
  },
  sentOn: { id: 'pages.InventoryTransfer.sentOn', defaultMessage: 'Sent On' },
  receivedOn: { id: 'pages.InventoryTransfer.receivedOn', defaultMessage: 'Received On' },
  consumableName: { id: 'pages.InventoryTransfer.consumableName', defaultMessage: 'Consumable' },
  receivedQuantity: { id: 'pages.InventoryTransfer.quantity', defaultMessage: 'Received Qty' },
  sentQuantity: { id: 'pages.InventoryTransfer.quantity', defaultMessage: 'Sent Qty' },
  originSiteName: { id: 'pages.InventoryTransfer.originSiteName', defaultMessage: 'From' },
  destinationSiteName: { id: 'pages.InventoryTransfer.destinationSiteName', defaultMessage: 'To' },
  lotNumber: { id: 'pages.InventoryTransfer.lotNumber', defaultMessage: 'Lot Number' },
  expirationDate: { id: 'pages.InventoryTransfer.expirationDate', defaultMessage: 'Expiration Date' },
  paginatorStatus: {
    id: 'pages.InventoryTransfer.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# Transfer}
      other {# Transfers}
    }`,
  },
})

export default messages
