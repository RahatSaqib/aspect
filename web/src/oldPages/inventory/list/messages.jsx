import { defineMessages } from 'react-intl'
import { consumableMessages } from '../../../messages'
import allMessage from '../../../messages/allMessages'
import { commonDefinitions } from '../../../messages/customMessages'

const messages = {
  ...commonDefinitions,
  ...consumableMessages,
  ...allMessage,
  ...defineMessages({
    projectedWasteDescription: {
      id: 'pages.InventoryItemsList.projectedWasteDescription',
      defaultMessage:
        'The projected stock waste, assuming that the cartridges to be consumed are always the ones closer to their expiration',
    },
    daysStockLeftDescription: {
      id: 'pages.InventoryItemsList.daysStockLeftDescription',
      defaultMessage:
        'The number of days left with available and not-expired stock, assuming that the cartridges to be consumed are always the ones closer to their expiration',
    },
    inventoryItemsTitle: {
      id: 'pages.InventoryItemsList.inventoryItemsTitle',
      defaultMessage: 'Inventory on Hand',
    },
    breakOutByLot: {
      id: 'pages.InventoryItemsList.breakOutByLot',
      defaultMessage: 'Break out by lot',
    },
    siteName: {
      id: 'pages.InventoryItemsList.siteName',
      defaultMessage: 'Site Name',
    },
    consumableName: {
      id: 'pages.InventoryItemsList.consumableName',
      defaultMessage: 'Consumable',
    },
    quantityOnHand: {
      id: 'pages.InventoryItemsList.quantityOnHand',
      defaultMessage: 'Quantity on Hand',
    },
    quantityOnHandDescription: {
      id: 'pages.InventoryItemsList.quantityOnHandDescription',
      defaultMessage: 'Its the current quantity in hand, including the expired quantity.',
    },
    unreconciledQuantity: {
      id: 'pages.InventoryItemsList.unreconciledQuantity',
      defaultMessage: 'Unreconciled Quantity',
    },
    unreconciledQuantityDescription: {
      id: 'pages.InventoryItemsList.unreconciledQuantityDescription',
      defaultMessage: 'Total cartridges consumed and reported under tests but not yet adjusted against the inventory',
    },
    dailyConsumptionRate: {
      id: 'pages.InventoryItemsList.dailyConsumptionRate',
      defaultMessage: 'Daily Consumption',
    },
    dailyConsumptionRateDescription: {
      id: 'pages.InventoryItemsList.dailyConsumptionRateDescription',
      defaultMessage: 'Its the average daily consumption of the specific cartridge considering the last 180 day period',
    },
    notRecorded: {
      id: 'pages.InventoryItemsList.notRecorded',
      defaultMessage: 'Not Recorded',
    },
    noConsumption: {
      id: 'pages.InventoryItemsList.noConsumption',
      defaultMessage: 'No Consumption',
    },
    expiresOn: {
      id: 'pages.InventoryItemsList.expiresOn',
      defaultMessage: 'Expires On',
    },
    lotNumber: {
      id: 'pages.InventoryItemsList.lotNumber',
      defaultMessage: 'Lot Number',
    },
    expiresIn: {
      id: 'pages.InventoryItemsList.expiresIn',
      defaultMessage: 'Expires',
    },
    adjust: {
      id: 'pages.InventoryItemsList.adjust',
      defaultMessage: 'Adjust',
    },
    addInventory: {
      id: 'pages.InventoryItemsList.addInventory',
      defaultMessage: 'Add Inventory',
    },
    physicalCount: {
      id: 'pages.InventoryItemsList.physicalCount',
      defaultMessage: 'Physical Count',
    },
    transferInventory: {
      id: 'pages.InventoryItemsList.transferInventory',
      defaultMessage: 'Transfer Inventory',
    },
    receiveInventory: {
      id: 'pages.InventoryItemsList.receiveInventory',
      defaultMessage: 'Receive Inventory in Transit',
    },
    removeInventory: {
      id: 'pages.InventoryItemsList.removeInventory',
      defaultMessage: 'Remove Inventory',
    },
    paginatorStatus: {
      id: 'pages.InventoryItemsList.paginatorStatus',
      defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
        one {# supply}
        other {# supplies}
      }`,
    },
    inTransitFromSiteName: {
      id: 'pages.inTransit.InventoryItemsList.inTransitFromSiteName',
      defaultMessage: '*In transit from {inTransitFromSiteName}',
    },
    excludedLotInTransit: {
      id: 'pages.excluded.InventoryItemsList.inTransitFromSiteName',
      defaultMessage: '*Excluded {pendingTransfersQuantityOnHand} items in {pendingTransfers} lot/s in transit',
    },
    never: {
      id: 'pages.InventoryItemsList.never',
      defaultMessage: 'Never',
    },
    inventoryAdjustedSuccessfully: {
      id: 'pages.InventoryItemsList.inventoryAdjustedSuccessfully',
      defaultMessage: 'Inventory levels have been adjusted successfully',
    },
    daysStockLeft: {
      id: 'pages.InventoryItemsList.daysStockLeft',
      defaultMessage: 'Days Stock Left',
    },
    projectedWaste: {
      id: 'pages.InventoryItemsList.projectedWaste',
      defaultMessage: 'Projected stock waste',
    },
    inventoryOnHand: {
      id: 'pages.InventoryItemsList.inventoryOnHand',
      defaultMessage: 'Inventory on Hand',
    },
    adjustQuantity: {
      id: 'pages.InventoryItemsList.adjustQuantity',
      defaultMessage: 'Adjust Quantity',
    },
    newQuantityOnHand: {
      id: 'pages.InventoryItemsList.newQuantityOnHand',
      defaultMessage: 'New Quantity On Hand',
    },
    resultQuantityOnHand: {
      id: 'pages.InventoryItemsList.resultQuantityOnHand',
      defaultMessage: 'Increase/Decrease',
    },
    inventoryOnNote: {
      id: 'pages.InventoryItemsList.inventoryOnNote',
      defaultMessage: 'notes',
    },
    inventoryOnMandatoryNote: {
      id: 'pages.InventoryItemsList.inventoryOnHand.mandatoryNote',
      defaultMessage: 'This is a mandatory field its mandatory and must be at least 3 characters long',
    },
    consumableReason: {
      id: 'pages.InventoryItemsList.inventoryOnHand.consumableReason',
      defaultMessage: 'Consumable Reason',
    },
    backButton: {
      id: 'pages.InventoryItemsList.inventoryOnHand.backButton',
      defaultMessage: 'Back',
    },
    expired: {
      id: 'pages.InventoryItemsList.expired',
      defaultMessage: 'Expired',
    },
  }),
}

export default messages
