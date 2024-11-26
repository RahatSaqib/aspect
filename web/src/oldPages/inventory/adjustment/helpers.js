import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { object, string, number, date } from 'yup'
import { types } from '../../../store/InventoryRedux'
import {
  newInventoryMessages,
  receiveInventoryMessages,
  removeInventoryMessages,
  transformInventoryMessages,
  validationMessages,
} from './messages'

export const hasExpireDate = strategy => !!strategy?.includes('ExpirationDate')
export const hasLot = strategy => !!strategy?.includes('Lot')

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

export function getValidations(format, actionType, inventory) {
  let schema = object({
    quantity: number()
      .typeError(format(validationMessages.quantityNumber))
      .required(format(validationMessages.quantityRequired))
      .positive(format(validationMessages.quantityPositive))
      .integer(format(validationMessages.quantityInteger)),
    dateAdjusted: date().max(new Date(), format(validationMessages.dateAdjustedGreaterThanToday)),
  })

  /**
   * `inventory` is not set only for global add inventory (actionType === types.SHOW_NEW_INVENTORY_DIALOG)
   * so below for `consumable` field depends only on `toSiteId`
   */
  if (!inventory) {
    /**
     * show error for required field only when toSiteId is defined,
     * because value of `consumable` field depend on corresponding toSite.siteConsumables and no need
     * to bother user's eyes with `consumable` validation message when toSite is not selected
     */
    if (actionType === types.SHOW_NEW_INVENTORY_DIALOG) {
      schema = schema.shape({
        consumable: object()
          .nullable()
          .when('toSiteId', {
            is: val => !!val,
            then: sch => sch.required(format(validationMessages.consumableRequired)),
          }),
      })
    }
  }

  if (actionType !== types.SHOW_RECEIVE_INVENTORY_DIALOG) {
    schema = schema.shape({
      expiresOn: date()
        .nullable()
        .when('consumable', {
          is: () => {
            // return hasExpireDate(consumable?.strategy || inventory?.strategy)
            return true
          },
          then: sch => {
            let validation = sch.required(format(validationMessages.expiryDateRequired))
            if (![types.SHOW_RECEIVE_INVENTORY_DIALOG, types.SHOW_TRANSFER_INVENTORY_DIALOG].includes(actionType)) {
              validation = validation.min(new Date(), format(validationMessages.expiryDateAfterToday))
            }
            return validation
          },
        }),
      lotNumber: string()
        .nullable()
        .when('consumable', {
          is: () => {
            // return hasLot(consumable?.strategy || inventory?.strategy)
            return true
          },
          then: sch => sch.required(format(validationMessages.lotNumberRequired)),
        }),
    })
  }

  if (actionType !== types.SHOW_REMOVE_INVENTORY_DIALOG) {
    schema = schema.shape({
      toSiteId: string().required(format(validationMessages.siteRequired)),
    })
  }

  if (actionType === types.SHOW_REMOVE_INVENTORY_DIALOG) {
    schema = schema.shape({ reason: object().nullable().required(format(validationMessages.reasonRequired)) })
  }

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
