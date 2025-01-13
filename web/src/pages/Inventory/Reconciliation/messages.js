import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../../messages'
import allMessage from '../../../messages/allMessages'

const messages = {
  ...commonDefinitions,
  ...allMessage,
  ...defineMessages({
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
    breakdownByLots: {
      id: 'pages.inventoryReconciliation.breakdownByLots',
      defaultMessage: 'Breakdown by Lots',
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
  }),
}

export default messages
