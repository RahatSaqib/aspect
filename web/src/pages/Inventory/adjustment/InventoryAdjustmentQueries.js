import { defineMessages } from 'react-intl'
import fetchWrapperForQueries from '../../../components/QueryFetch'
import { badRequestBuilder, errorPleaseTryAgainInAFewMinutes } from '../../../utils/error/CommonErrorNotifications'
import { adjustmentActions } from './actionTypes'

const addErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.addInventory.PUT.default.title',
    defaultMessage: 'Adding Inventory Failed',
  },
})

const removeErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.removeInventory.PUT.default.title',
    defaultMessage: 'Removing Inventory Failed',
  },
})

const transferErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.transferInventory.PUT.default.title',
    defaultMessage: 'Transferring Inventory Failed',
  },
})

const receiveErrorMessages = defineMessages({
  title: {
    id: 'errorResponseMessages.receiveInventory.PUT.default.title',
    defaultMessage: 'Receiving Inventory Failed',
  },
})

const removeNotFoundMessages = defineMessages({
  missingInventoryItemTitle: {
    id: 'errorResponseMessages.removeInventory.PUT.missingInventoryItem.title',
    defaultMessage: 'Removing Inventory Failed',
  },
  missingInventoryItem: {
    id: 'errorResponseMessages.removeInventory.PUT.missingInventoryItem.resolution',
    defaultMessage: 'Can not deduct from non-existed inventory item.',
  },
  negativeQuantityTitle: {
    id: 'errorResponseMessages.removeInventory.PUT.negativeQuantity.title',
    defaultMessage: 'Removing Inventory Failed',
  },
  negativeQuantity: {
    id: 'errorResponseMessages.removeInventory.PUT.negativeQuantity.resolution',
    defaultMessage: 'Quantity is negative for current inventory.',
  },
  notEnoughInventoryTitle: {
    id: 'errorResponseMessages.removeInventory.PUT.notEnoughInventory.title',
    defaultMessage: 'Removing Inventory Failed',
  },
  notEnoughInventory: {
    id: 'errorResponseMessages.removeInventory.PUT.notEnoughInventory.resolution',
    defaultMessage: 'Not enough inventory items on the site to remove.',
  },
})

const transferNotFoundMessages = defineMessages({
  missingInventoryItemTitle: {
    id: 'errorResponseMessages.transferInventory.transfer.missingInventoryItem.PUT.title',
    defaultMessage: 'Transferring Inventory Failed',
  },
  missingInventoryItem: {
    id: 'errorResponseMessages.transferInventory.transfer.PUT.missingInventoryItem.resolution',
    defaultMessage: 'Can not deduct from non-existed inventory item.',
  },
  negativeQuantityTitle: {
    id: 'errorResponseMessages.transferInventory.transfer.negativeQuantity.negativeQuantity.PUT.title',
    defaultMessage: 'Transferring Inventory Failed',
  },
  negativeQuantity: {
    id: 'errorResponseMessages.transferInventory.transfer.PUT.negativeQuantity.resolution',
    defaultMessage: 'Quantity is negative for current inventory.',
  },
  notEnoughInventoryTitle: {
    id: 'errorResponseMessages.transferInventory.transfer.notEnoughInventory.PUT.title',
    defaultMessage: 'Transferring Inventory Failed',
  },
  notEnoughInventory: {
    id: 'errorResponseMessages.transferInventory.transfer.PUT.notEnoughInventory.resolution',
    defaultMessage: 'Not enough inventory items on the site to remove.',
  },
})

const adjustments = {
  [adjustmentActions.NEW]: {
    endpoint: '/inventory/add',
    customErrorNotifications: { default: errorPleaseTryAgainInAFewMinutes(addErrorMessages) },
  },
  [adjustmentActions.ADD]: {
    endpoint: '/inventory/add',
    customErrorNotifications: { default: errorPleaseTryAgainInAFewMinutes(addErrorMessages) },
  },
  [adjustmentActions.REMOVE]: {
    endpoint: '/inventory/remove',
    customErrorNotifications: {
      404: badRequestBuilder(removeNotFoundMessages),
      default: errorPleaseTryAgainInAFewMinutes(removeErrorMessages),
    },
  },
  [adjustmentActions.TRANSFER]: {
    endpoint: '/inventory/transfer',
    customErrorNotifications: {
      404: badRequestBuilder(transferNotFoundMessages),
      default: errorPleaseTryAgainInAFewMinutes(transferErrorMessages),
    },
  },
  [adjustmentActions.RECEIVE]: {
    endpoint: '/inventory/receive',
    customErrorNotifications: { default: errorPleaseTryAgainInAFewMinutes(receiveErrorMessages) },
  },
}

export default function adjustInventory({ actionType, values, inventoryItem }) {
  const { endpoint, customErrorNotifications } = adjustments[actionType]
  const isAdd = [adjustmentActions.NEW, adjustmentActions.ADD].includes(actionType)

  return fetchWrapperForQueries({
    endpoint,
    method: 'PUT',
    params: {
      ...values,
      consumableId: isAdd ? values.consumableId || inventoryItem?.consumableId : inventoryItem?.consumableId,
    },
    customErrorNotifications,
  })
}
