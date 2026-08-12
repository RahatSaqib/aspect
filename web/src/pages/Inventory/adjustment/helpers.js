import isNil from 'lodash/isNil'
import omitBy from 'lodash/omitBy'
import { date, number, object, string } from 'yup'
import { adjustmentActions } from './actionTypes'
import {
  newInventoryMessages,
  receiveInventoryMessages,
  removeInventoryMessages,
  transformInventoryMessages,
  validationMessages,
} from './messages'

export function transformValues(values) {
  const { consumable, reason, inventoryItem, ...rest } = values
  return omitBy(
    {
      ...rest,
      consumableId: consumable?.id,
      reasonId: reason?.id,
    },
    isNil
  )
}

export function getValidations(format, actionType, { requireExpirationDate, requireLotNumber, inventory }) {
  const uiAdd = [adjustmentActions.NEW, adjustmentActions.ADD].includes(actionType)
  const uiTransfer = actionType === adjustmentActions.TRANSFER
  const uiRemove = actionType === adjustmentActions.REMOVE
  const uiReceive = actionType === adjustmentActions.RECEIVE

  const skipValidation = uiTransfer || uiRemove || uiReceive

  let schema = object({
    quantity: number()
      .typeError(format(validationMessages.quantityNumber))
      .required(format(validationMessages.quantityRequired))
      .positive(format(validationMessages.quantityPositive))
      .integer(format(validationMessages.quantityInteger))
      .when('consumable', {
        is: () => {
          return !!inventory && (uiTransfer || uiRemove || uiReceive)
        },
        then: sch => sch.max(inventory.quantityOnHand, format(validationMessages.quantityNotMoreThanOnHand)),
      }),
    dateAdjusted: date().max(new Date(), format(validationMessages.dateAdjustedGreaterThanToday)),
  })

  /**
   * `inventory` is not set only for global add inventory (actionType === adjustmentActions.NEW)
   * so below for `consumable` field depends only on `toSiteId`
   */
  if (!inventory) {
    /**
     * show error for required field only when toSiteId is defined,
     * because value of `consumable` field depend on corresponding toSite.siteConsumables and no need
     * to bother user's eyes with `consumable` validation message when toSite is not selected
     */
    if (uiAdd) {
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

  if (actionType !== adjustmentActions.RECEIVE) {
    schema = schema.shape({
      expiresOn: date()
        .nullable()
        .when(['consumable'], {
          is: () => requireExpirationDate && !skipValidation,
          then: sch => sch.required(format(validationMessages.expiryDateRequired)),
        }),
      lotNumber: string()
        .nullable()
        .when('consumable', {
          is: () => requireLotNumber && !skipValidation,
          then: sch => sch.required(format(validationMessages.lotNumberRequired)),
        }),
    })
  }

  if (uiTransfer && !inventory?.expiresOn && !inventory?.lotNumber) {
    schema = schema.shape({
      inventoryItem: string().required(format(validationMessages.inventoryItemRequired)),
    })
  }

  if (actionType !== adjustmentActions.REMOVE) {
    schema = schema.shape({
      toSiteId: string().required(format(validationMessages.siteRequired)),
    })
  }

  if (uiAdd || uiRemove) {
    schema = schema.shape({
      reason: object().nullable().required(format(validationMessages.reasonRequired)),
      notes: string()
        .nullable()
        .when('reason', {
          is: reason => reason?.externalId === 'other',
          then: sch => sch.required(format(validationMessages.notesRequired)),
        }),
    })
  }

  return schema
}

export function getQuantityOnHand(actionType, inventory, values) {
  let nextQuantity
  switch (actionType) {
    case adjustmentActions.REMOVE:
    case adjustmentActions.TRANSFER: {
      const quantityOnHand = values.lotNumber || values.expiresOn ? inventory.quantityOnHand : 0
      nextQuantity = quantityOnHand - Number(values?.quantity ?? 0)
      break
    }
    case adjustmentActions.RECEIVE:
      nextQuantity = values?.quantity
      break
    case adjustmentActions.ADD:
      // If the reason is 'physical_count', just return the entered quantity
      if (values?.reason?.externalId === 'physical_count') {
        nextQuantity = Number(values.quantity)
      } else {
        nextQuantity = Number(inventory.quantityOnHand) + Number(values.quantity)
      }
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
    case adjustmentActions.REMOVE:
      return removeInventoryMessages
    case adjustmentActions.TRANSFER:
      return transformInventoryMessages
    case adjustmentActions.RECEIVE:
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
      quantity: actionType === adjustmentActions.RECEIVE ? inventory.quantityOnHand : '',
      toSiteId: [adjustmentActions.ADD, adjustmentActions.RECEIVE].includes(actionType) ? inventory.siteId : undefined,
      fromSiteId:
        actionType === adjustmentActions.RECEIVE
          ? inventory?.inTransitFromSiteId
          : ![adjustmentActions.ADD, adjustmentActions.NEW].includes(actionType)
          ? inventory.siteId
          : undefined,
      lotNumber: inventory?.lotNumber || '',
      expiresOn: inventory?.expiresOn || null,
      consumable: {
        id: inventory.consumableId,
        name: inventory.consumableName,
        requireExpirationDate: inventory.requireExpirationDate,
        showLot: inventory.showLot,
        unitShortName: inventory.unitShortName,
        i18nKey: inventory.consumableNameI18nKey,
      },
    }
  }

  return value
}
