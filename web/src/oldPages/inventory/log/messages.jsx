import { defineMessages } from 'react-intl'
import { consumableMessages, consumableReasonMessages } from '../../../messages'
import allMessage from '../../../messages/allMessages'
import { commonDefinitions } from '../../../messages/customMessages'

const messages = {
  ...commonDefinitions,
  ...allMessage,
  ...consumableMessages,
  ...consumableReasonMessages,
  ...defineMessages({
    registrationDate: {
      id: 'pages.InventoryLog.registrationDate',
      defaultMessage: 'Registration Date',
    },
    inventoryLogTitle: {
      id: 'pages.InventoryLog.inventoryLogTitle',
      defaultMessage: 'Inventory Log',
    },
    siteName: {
      id: 'pages.InventoryLog.siteName',
      defaultMessage: 'Site Name',
    },
    consumableName: {
      id: 'pages.InventoryLog.consumableName',
      defaultMessage: 'Consumable',
    },
    reason: {
      id: 'pages.InventoryLog.reason',
      defaultMessage: 'Reason',
    },
    transactionDate: {
      id: 'pages.InventoryLog.transactionDate',
      defaultMessage: 'Transaction Date',
    },
    quantity: {
      id: 'pages.InventoryLog.quantity',
      defaultMessage: 'Quantity',
    },
    notes: {
      id: 'pages.InventoryLog.notes',
      defaultMessage: 'Notes',
    },
    reconcilationAdjustment: {
      id: 'pages.InventoryLog.reconcilationAdjustment',
      defaultMessage: 'Applied Consumption strategy',
    },
    reconcilationStrategy: {
      id: 'pages.InventoryLog.reconcilationStrategy',
      defaultMessage: 'Applied Cartridge Batch strategy',
    },
    currentSiteAdjustment: {
      id: 'pages.InventoryLog.currentSiteAdjustment',
      defaultMessage: 'Current Site',
    },
    currentSiteAndProviderAdjustment: {
      id: 'pages.InventoryLog.currentSiteAndProviderAdjustment',
      defaultMessage: 'Current Site and Stock Provider',
    },
    currentSiteAndProviderAndNationalAdjustment: {
      id: 'pages.InventoryLog.currentSiteAndProviderAndNationalAdjustment',
      defaultMessage: 'Current Site, Stock Provider and all Parent Sites',
    },
    withLotStrategy: {
      id: 'pages.InventoryLog.withLotStrategy',
      defaultMessage: 'Cartridge Lot Number',
    },
    withExpirationDateStrategy: {
      id: 'pages.InventoryLog.withExpirationDateStrategy',
      defaultMessage: 'Expiry Date',
    },
    withLotAndExpirationDateStrategy: {
      id: 'pages.InventoryLog.withLotAndExpirationDateStrategy',
      defaultMessage: 'Expiry Date and Cartridge Lot Number',
    },
    notRecorded: {
      id: 'pages.InventoryLog.notRecorded',
      defaultMessage: 'Not Recorded',
    },
    noConsumption: {
      id: 'pages.InventoryLog.noConsumption',
      defaultMessage: 'No Consumption',
    },
    expiresOn: {
      id: 'pages.InventoryLog.expiresOn',
      defaultMessage: 'Expires On',
    },
    lotNumber: {
      id: 'pages.InventoryLog.lotNumber',
      defaultMessage: 'Lot Number',
    },
    expiresIn: {
      id: 'pages.InventoryLog.expiresIn',
      defaultMessage: 'Expires',
    },
    adjust: {
      id: 'pages.InventoryLog.adjust',
      defaultMessage: 'Adjust',
    },
    adjustFromTo: {
      id: 'pages.InventoryLog.adjustFromTo',
      defaultMessage: '*Adjusted from {from} to {to}',
    },
    paginatorStatus: {
      id: 'pages.InventoryLog.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
        one {# supply}
        other {# supplies}
      }`,
    },
    inTransitFromSiteName: {
      id: 'pages.InventoryLog.inTransitFromSiteName',
      defaultMessage: '*In transit from {inTransitFromSiteName}',
    },
    excludedLotInTransit: {
      id: 'pages.InventoryLog.excluded.inTransitFromSiteName',
      defaultMessage: '*Excluded {pendingTransfersQuantityOnHand} items in {pendingTransfers} lot/s in transit',
    },
    never: {
      id: 'pages.InventoryLog.never',
      defaultMessage: 'Never',
    },
    inventoryAdjustedSuccessfully: {
      id: 'pages.InventoryLog.inventoryAdjustedSuccessfully',
      defaultMessage: 'Inventory levels have been adjusted successfully',
    },
    daysStockLeft: {
      id: 'pages.InventoryLog.daysStockLeft',
      defaultMessage: 'Days Stock Left',
    },
    projectedWaste: {
      id: 'pages.InventoryLog.projectedWaste',
      defaultMessage: 'Projected stock waste',
    },
  }),
}

export default messages
