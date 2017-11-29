const _ = require('lodash')
const Boom = require('boom')
const setMilliseconds = require('date-fns/set_milliseconds')
const {
  findConsumables,
  findConsumableReason,
} = require('../../../consumable/consumableService')
const {
  increaseInventory,
  decreaseInventory,
} = require('../../../inventory/service')
const { getDevice } = require('../../../device/service')

function* postProcessAddDeviceOperation(context) {
  const { payload, device, now } = context
  const inventoryChanges = _.get(payload, 'data.inventoryChanges')
  if (!_.isEmpty(inventoryChanges)) {
    const sortedInventoryChanges = _.sortBy(
      inventoryChanges,
      inventoryChange => new Date(inventoryChange.DateChanged)
    )
    for (let i = 0; i < sortedInventoryChanges.length; i++) {
      const inventoryChange = sortedInventoryChanges[i]
      const matchingConsumables = yield* findConsumables({
        name: inventoryChange.ConsumableName,
      })
      if (matchingConsumables.length === 1) {
        const matchingConsumable = matchingConsumables[0]
        const isDecrease = inventoryChange.Quantity < 0
        const matchingConsumableReason = yield* findConsumableReason(
          inventoryChange.ConsumableReasonName,
          isDecrease
        )
        if (matchingConsumableReason) {
          const absoluteQuantity = Math.abs(inventoryChange.Quantity)
          const changeFunction = isDecrease
            ? decreaseInventory
            : increaseInventory
          if (!device.siteId && device.id) {
            const deviceData = yield* getDevice(device.id)
            device.siteId = deviceData.siteId
          }
          if (!device.siteId) {
            throw Boom.notFound(
              'Cannot determine which site this request came from'
            )
          }
          const changeParameters = {
            siteId: device.siteId,
            consumableId: matchingConsumable.id,
            expiresOn: inventoryChange.ExpirationDate
              ? new Date(inventoryChange.ExpirationDate)
              : null,
            quantity: absoluteQuantity,
            quantityOnHand: inventoryChange.ResultingQuantityOnHand,
            reasonId: matchingConsumableReason.id,
            dateAdjustedFrom: inventoryChange.DateChanged
              ? setMilliseconds(new Date(inventoryChange.DateChanged), 0)
              : null,
            now,
          }
          changeParameters.operation = isDecrease
            ? 'remove from GxConnect'
            : 'add from GxConnect'
          yield* changeFunction(changeParameters)
        }
      }
    }
  }
  return {}
}

module.exports = postProcessAddDeviceOperation
