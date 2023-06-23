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
})

export const validationMessages = defineMessages({
  consumableRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.consumableRequired',
    defaultMessage: 'Please specify a consumable',
  },
  quantityRequired: {
    id: 'pages.NewInventoryDialogForm.quantityRequired',
    defaultMessage: 'Please specify the quantity',
  },
  expiryDateRequired: {
    id: 'pages.InventoryAdjustmentDialogForm.expiryDateRequired',
    defaultMessage: 'Please specify an expiry date',
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
})

export const newInventoryMessages = defineMessages({
  dialogTitle: {
    id: 'pages.NewInventoryDialogForm.dialogTitle',
    defaultMessage: 'Add {consumableName}',
  },
  quantity: {
    id: 'pages.NewInventoryDialogForm.quantity',
    defaultMessage: 'Quantity to Add',
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

export default messages
