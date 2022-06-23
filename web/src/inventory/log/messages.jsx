import { defineMessages } from 'react-intl'

const messages = defineMessages({
  date: {
    id: 'pages.InventoryLog.date',
    defaultMessage: 'Date',
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
  quantity: {
    id: 'pages.InventoryLog.quantity',
    defaultMessage: 'Quantity',
  },
  notes: {
    id: 'pages.InventoryLog.notes',
    defaultMessage: 'Notes',
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
  ConsumableReason_TransferSent: {
    id: 'pages.InventoryLog.ConsumableReason_TransferSent',
    defaultMessage: 'Tranfer sent to {refSiteName}',
  },
  ConsumableReason_TransferReceived: {
    id: 'pages.InventoryLog.ConsumableReason_TransferReceived',
    defaultMessage: 'Tranfer received from {refSiteName}',
  },
  ConsumableReason_AssertedZeroInventory: {
    id: 'pages.InventoryLog.ConsumableReason_AssertedZeroInventory',
    defaultMessage: 'Asserted zero inventory',
  },
  ConsumableReason_TestConducted: {
    id: 'pages.InventoryLog.ConsumableReason_TestConducted',
    defaultMessage: 'Test conducted',
  },
  ConsumableReason_Expired: {
    id: 'pages.InventoryLog.ConsumableReason_Expired',
    defaultMessage: 'Expired',
  },
  ConsumableReason_Imported: {
    id: 'pages.InventoryLog.ConsumableReason_Imported',
    defaultMessage: 'Imported',
  },
  ConsumableReason_Stolen: {
    id: 'pages.InventoryLog.ConsumableReason_Stolen',
    defaultMessage: 'Stolen',
  },
  ConsumableReason_Lost: {
    id: 'pages.InventoryLog.ConsumableReason_Lost',
    defaultMessage: 'Lost',
  },
  ConsumableReason_Captured: {
    id: 'pages.InventoryLog.ConsumableReason_Captured',
    defaultMessage: 'Captured',
  },
  ConsumableReason_Damage: {
    id: 'pages.InventoryLog.ConsumableReason_Damage',
    defaultMessage: 'Damage',
  },
})

export default messages
