import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { object, string } from 'yup'
import { types } from '../../../store/InventoryRedux'
import {
  newInventoryMessages,
  receiveInventoryMessages,
  removeInventoryMessages,
  transformInventoryMessages,
  validationMessages,
} from './messages'

export function transformValues(values) {
  const { consumable, reason, ...rest } = values
  return omitBy(
    {
      ...rest,
      consumableId: consumable?.id,
      reasonId: reason?.id,
    },
    isNil
  )
}

export function getValidations(format, actionType) {
  let schema = object({
    consumable: object().nullable().required(format(validationMessages.consumableRequired)),
    quantity: string().required(format(validationMessages.quantityRequired)),
  })

  if (actionType !== types.SHOW_REMOVE_INVENTORY_DIALOG)
    schema = schema.shape({ toSiteId: string().required(format(validationMessages.siteRequired)) })

  if (actionType === types.SHOW_REMOVE_INVENTORY_DIALOG)
    schema = schema.shape({ reason: object().nullable().required(format(validationMessages.reasonRequired)) })

  return schema
}

export function getQuantityOnHand(actionType, inventory, values) {
  let nextQuantity
  switch (actionType) {
    case types.SHOW_REMOVE_INVENTORY_DIALOG:
    case types.SHOW_TRANSFER_INVENTORY_DIALOG:
      nextQuantity = inventory.quantityOnHand - Number(values?.quantity ?? 0)
      break
    case types.SHOW_RECEIVE_INVENTORY_DIALOG:
      nextQuantity = values?.quantity
      break
    default:
      nextQuantity = inventory.quantityOnHand + Number(values?.quantity ?? 0)
  }
  return {
    nextQuantity,
    unitShortName: values?.consumable?.unitShortName,
  }
}

export function getLabels(actionType) {
  switch (actionType) {
    case types.SHOW_REMOVE_INVENTORY_DIALOG:
      return removeInventoryMessages
    case types.SHOW_TRANSFER_INVENTORY_DIALOG:
      return transformInventoryMessages
    case types.SHOW_RECEIVE_INVENTORY_DIALOG:
      return receiveInventoryMessages
    default:
      return newInventoryMessages
  }
}

export function transformInitialValue(inventory, actionType) {
  let value = { dateAdjusted: new Date(), quantity: '', lotNumber: '' }
  if (inventory) {
    value = {
      ...value,
      quantity: actionType === types.SHOW_RECEIVE_INVENTORY_DIALOG ? inventory.quantityOnHand : '',
      toSiteId: [types.SHOW_ADD_INVENTORY_DIALOG, types.SHOW_RECEIVE_INVENTORY_DIALOG].includes(actionType)
        ? inventory.siteId
        : undefined,
      fromSiteId:
        actionType === types.SHOW_RECEIVE_INVENTORY_DIALOG
          ? inventory?.inTransitFromSiteId
          : ![types.SHOW_ADD_INVENTORY_DIALOG, types.SHOW_NEW_INVENTORY_DIALOG].includes(actionType)
          ? inventory.siteId
          : undefined,
      lotNumber: inventory?.lotNumber,
      expiresOn: inventory?.expiresOn,
      consumable: {
        id: inventory.consumableId,
        name: inventory.consumableName,
        showExpirationDate: inventory.showExpirationDate,
        showLot: inventory.showLot,
        unitShortName: inventory.unitShortName,
        i18nKey: inventory.consumableNameI18nKey,
      },
    }
  }

  return value
}
