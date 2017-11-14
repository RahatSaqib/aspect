const _ = require('lodash')
const {
  findConsumables,
  findConsumableReasons,
} = require('../../../consumable/consumableService')
const {
  increaseInventory,
  decreaseInventory,
} = require('../../../inventory/service')

function* postProcessAddDeviceOperation(context) {
  const { payload, device, now } = context
  const inventoryChanges = _.get(payload, 'data.inventoryChanges')
  if (!_.isEmpty(inventoryChanges)) {
    for (let i = 0; i < inventoryChanges.length; i++) {
      const inventoryChange = inventoryChanges[i]
      const matchingConsumables = yield* findConsumables({
        name: inventoryChange.ConsumableName,
      })
      if (matchingConsumables.length === 1) {
        const matchingConsumable = matchingConsumables[0]
        const matchingConsumableReasons = yield* findConsumableReasons({
          name: inventoryChange.ConsumableReasonName,
        })
        if (matchingConsumableReasons.length === 1) {
          const matchingConsumableReason = matchingConsumableReasons[0]
          const changeFunction = matchingConsumableReason.decrease
            ? decreaseInventory
            : increaseInventory
          const changeParameters = {
            siteId: device.siteId,
            consumableId: matchingConsumable.id,
            expiresOn: inventoryChange.ExpirationDate,
            quantity: inventoryChange.Quantity,
            reasonId: matchingConsumableReason.id,
            dateAdjustedFrom: inventoryChange.DateChanged,
            now,
          }
          changeParameters.operation = matchingConsumableReason.decrease
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
