import { defineMessages } from 'react-intl'

const messages = defineMessages({
  date: {
    id: 'pages.InventoryLog.date',
    defaultMessage: 'Date',
  },
  projectedWasteDescription: {
    id: 'pages.InventoryLog.projectedWasteDescription',
    defaultMessage:
      'The projected stock waste, assuming that the cartridges to be consumed are always the ones closer to their expiration',
  },
  daysStockLeftDescription: {
    id: 'pages.InventoryLog.daysStockLeftDescription',
    defaultMessage:
      'The number of days left with available and not-expired stock, assuming that the cartridges to be consumed are always the ones closer to their expiration',
  },
  inventoryItemsTitle: {
    id: 'pages.InventoryLog.inventoryItemsTitle',
    defaultMessage: 'Inventory on Hand',
  },
  breakOutByLot: {
    id: 'pages.InventoryLog.breakOutByLot',
    defaultMessage: 'Break out by lot',
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
  quantity: {
    id: 'pages.InventoryLog.quantity',
    defaultMessage: 'Quantity',
  },
  notes: {
    id: 'pages.InventoryLog.notes',
    defaultMessage: 'Notes',
  },

  dailyConsumptionRate: {
    id: 'pages.InventoryLog.dailyConsumptionRate',
    defaultMessage: 'Daily Consumption',
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
  addInventory: {
    id: 'pages.InventoryLog.addInventory',
    defaultMessage: 'Add Inventory',
  },
  transferInventory: {
    id: 'pages.InventoryLog.transferInventory',
    defaultMessage: 'Transfer Inventory',
  },
  receiveInventory: {
    id: 'pages.InventoryLog.receiveInventory',
    defaultMessage: 'Receive Inventory in Transit',
  },
  removeInventory: {
    id: 'pages.InventoryLog.removeInventory',
    defaultMessage: 'Remove Inventory',
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
    defaultMessage: '* in transit from {inTransitFromSiteName}',
  },
  excludedLotInTransit: {
    id: 'pages.InventoryLog.inTransitFromSiteName',
    defaultMessage:
      '* excluded {pendingTransfersQuantityOnHand} items in {pendingTransfers} lot/s in transit',
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
})

export default messages
