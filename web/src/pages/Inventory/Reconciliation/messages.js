import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../../messages'

const messages = defineMessages({
  ...commonDefinitions,
  inventoryReconciliation: {
    id: 'pages.inventoryReconciliation.title',
    defaultMessage: 'Inventory Reconciliation',
  },
  testEndedOn: {
    id: 'pages.inventoryReconciliation.testEndedOn',
    defaultMessage: 'Test Ended On',
  },
  siteName: {
    id: 'pages.inventoryReconciliation.siteName',
    defaultMessage: 'Site Name',
  },
  consumable: {
    id: 'pages.inventoryReconciliation.consumable',
    defaultMessage: 'Consumable',
  },
  expiryDate: {
    id: 'pages.inventoryReconciliation.expiryDate',
    defaultMessage: 'Expiry Date',
  },
  lotNumber: {
    id: 'pages.inventoryReconciliation.lotNumber',
    defaultMessage: 'Lot Number',
  },
  unreconciledQuantity: {
    id: 'pages.inventoryReconciliation.unreconciledQuantity',
    defaultMessage: 'Unreconciled quantity',
  },
  paginatorStatus: {
    id: 'pages.inventoryReconciliation.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# }
      other {# }
    }`,
  },
})

export default messages
