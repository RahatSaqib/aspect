import { defineMessages } from 'react-intl'

const messages = defineMessages({
  inventoryItemsTitle: {
    id: 'pages.InventoryItemsList.inventoryItemsTitle',
    defaultMessage: 'Inventory on Hand',
  },
  groupBySite: {
    id: 'pages.InventoryItemsList.groupBySite',
    defaultMessage: 'Group by Site',
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
  dailyConsumptionRate: {
    id: 'pages.InventoryItemsList.dailyConsumptionRate',
    defaultMessage: 'Daily Consumption',
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
    id: 'pages.InventoryItemsList.inTransitFromSiteName',
    defaultMessage: '* in transit from {inTransitFromSiteName}',
  },
  never: {
    id: 'pages.InventoryItemsList.never',
    defaultMessage: 'Never',
  },
  inventoryAdjustedSuccessfully: {
    id: 'pages.InventoryItemsList.inventoryAdjustedSuccessfully',
    defaultMessage: 'Inventory levels have been adjusted successfully',
  },
  stockLeft: {
    id: 'pages.InventoryItemsList.stockLeft',
    defaultMessage: 'Days Stock Left',
  },
})

export default messages
