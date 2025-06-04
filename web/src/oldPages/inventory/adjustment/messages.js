import { defineMessages } from 'react-intl'

const messages = defineMessages({
  submit: {
    id: 'pages.InventoryAdjustmentDialogForm.submit',
    defaultMessage: 'Submit',
  },
  defaultConsumableName: {
    id: 'pages.NewInventoryDialogForm.defaultConsumableName',
    defaultMessage: 'Inventory Item',
  },
  nextQuantityStatus: {
    id: 'pages.NewInventoryDialogForm.nextQuantityStatus',
    defaultMessage: '(New quantity on hand: {nextQuantity} {unitShortName})',
  },
  resetWarning: {
    id: 'pages.InventoryAdjustmentDialogForm.resetWarning',
    defaultMessage:
      'This will reset the Inventory on Hand to {quantity}. Any movement before {resetDate} will be discarded from now on. Are you sure?',
  },
  cancel: {
    id: 'pages.InventoryAdjustmentDialogForm.cancel',
    defaultMessage: 'Cancel',
  },
  consumable: {
    id: 'pages.InventoryAdjustmentDialogForm.consumable',
    defaultMessage: 'Consumable',
  },
  lotNumber: {
    id: 'pages.InventoryAdjustmentDialogForm.lotNumber',
    defaultMessage: 'Lot Number',
  },
  cartridgeLotNumber: {
    id: 'pages.InventoryAdjustmentDialogForm.cartridgeLotNumber',
    defaultMessage: 'Cartridge Lot number',
  },
  expiryDate: {
    id: 'pages.InventoryAdjustmentDialogForm.expiryDate',
    defaultMessage: 'Expiry Date',
  },
  toSiteName: {
    id: 'pages.InventoryAdjustmentDialogForm.toSiteName',
    defaultMessage: 'To Site',
  },
  fromSiteName: {
    id: 'pages.InventoryAdjustmentDialogForm.fromSiteName',
    defaultMessage: 'From Site',
  },
  reason: {
    id: 'pages.InventoryAdjustmentDialogForm.reason',
    defaultMessage: 'Reason',
  },
  testsRunBetween: {
    id: 'pages.InventoryAdjustmentDialogForm.testsRunBetween',
    defaultMessage: 'Tests Run Between',
  },
  and: {
    id: 'pages.InventoryAdjustmentDialogForm.and',
    defaultMessage: 'and',
  },
  notes: {
    id: 'pages.InventoryAdjustmentDialogForm.notes',
    defaultMessage: 'Notes',
  },
  inventoryItem: {
    id: 'pages.InventoryAdjustmentDialogForm.inventoryItem',
    defaultMessage: 'Inventory Item',
  },
})

export const validationMessages = defineMessages({
  consumableRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.consumableRequired',
    defaultMessage: 'Please specify a consumable',
  },
  quantityMissingToTransfer: {
    id: 'pages.NewInventoryDialogForm.quantityMissingToTransfer',
    defaultMessage: 'No inventory to transfer',
  },
  quantityMissingToRemove: {
    id: 'pages.NewInventoryDialogForm.quantityMissingToRemove',
    defaultMessage: 'No inventory to remove',
  },
  quantityNumber: {
    id: 'pages.NewInventoryDialogForm.quantityNumber',
    defaultMessage: 'Please enter positive integer value',
  },
  quantityRequired: {
    id: 'pages.NewInventoryDialogForm.quantityRequired',
    defaultMessage: 'Please specify the quantity',
  },
  quantityPositive: {
    id: 'pages.NewInventoryDialogForm.quantityPositive',
    defaultMessage: 'Please enter positive value',
  },
  quantityInteger: {
    id: 'pages.NewInventoryDialogForm.quantityInteger',
    defaultMessage: 'Please enter integer value',
  },
  quantityNotMoreThanOnHand: {
    id: 'pages.NewInventoryDialogForm.quantityNotMoreThanOnHand',
    defaultMessage: 'Can not be greater than on-hand',
  },
  expiryDateRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.expiryDateRequired',
    defaultMessage: 'Please specify an expiry date',
  },
  expiryDateAfterToday: {
    id: 'pages.InventoryAdjustmentDialogForm.expiryDateAfterToday',
    defaultMessage: 'Must be later than today',
  },
  lotNumberRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.lotNumberRequired',
    defaultMessage: 'Please specify a lot number',
  },
  siteRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.siteRequired',
    defaultMessage: 'Please select a site',
  },
  reasonRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.reasonRequired',
    defaultMessage: 'Please select a reason',
  },
  dateRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.dateRequired',
    defaultMessage: 'Please specify a date',
  },
  dateFromAfterDateTo: {
    id: 'pages.InventoryAdjustmentDialogForm.dateFromAfterDateTo',
    defaultMessage: 'Please choose a date later or equal to from date',
  },
  dateAdjustedGreaterThanToday: {
    id: 'pages.InventoryAdjustmentDialogForm.dateAdjustedGreaterThanToday',
    defaultMessage: 'Please enter date until today',
  },
  inventoryItemRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.inventoryItemRequired',
    defaultMessage: 'Please choose an inventory item',
  },
  notesRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.notesRequired',
    defaultMessage: 'Please enter a note to explain the reason',
  },
})

export const newInventoryMessages = defineMessages({
  dialogTitle: {
    id: 'pages.NewInventoryDialogForm.dialogTitle',
    defaultMessage: '{consumableName}',
  },
  quantity: {
    id: 'pages.NewInventoryDialogForm.quantity',
    defaultMessage: 'Quantity',
  },
  dateAdjusted: {
    id: 'pages.NewInventoryDialogForm.dateAdjusted',
    defaultMessage: 'Date Added',
  },
})

export const removeInventoryMessages = defineMessages({
  dialogTitle: {
    id: 'pages.RemoveInventoryDialogForm.dialogTitle',
    defaultMessage: 'Remove {consumableName}',
  },
  quantity: {
    id: 'pages.RemoveInventoryDialogForm.quantity',
    defaultMessage: 'Quantity to Remove',
  },
  dateAdjusted: {
    id: 'pages.RemoveInventoryDialogForm.dateAdjusted',
    defaultMessage: 'Date Removed',
  },
})

export const transformInventoryMessages = defineMessages({
  dialogTitle: {
    id: 'pages.TransferInventoryDialogForm.dialogTitle',
    defaultMessage: 'Transfer {consumableName}',
  },
  quantity: {
    id: 'pages.TransferInventoryDialogForm.quantity',
    defaultMessage: 'Quantity to Transfer',
  },
  dateAdjusted: {
    id: 'pages.TransferInventoryDialogForm.dateAdjusted',
    defaultMessage: 'Date Transferred',
  },
})

export const receiveInventoryMessages = defineMessages({
  dialogTitle: {
    id: 'pages.ReceiveInventoryDialogForm.dialogTitle',
    defaultMessage: 'Receive {consumableName}',
  },
  quantity: {
    id: 'pages.ReceiveInventoryDialogForm.quantity',
    defaultMessage: 'Quantity Received',
  },
  dateAdjusted: {
    id: 'pages.ReceiveInventoryDialogForm.dateAdjusted',
    defaultMessage: 'Date Received',
  },
})

export default messages
