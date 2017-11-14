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
  const { knex, payload, device, now } = context
  const inventoryChanges = _.get(payload, 'data.inventoryChanges')
  if (!_.isEmpty(inventoryChanges)) {
    for (let i = 0; i < inventoryChanges.length; i++) {
      const inventoryChange = inventoryChanges[i]
      const matchingConsumables = yield* findConsumables(
        { name: inventoryChange.ConsumableName },
        knex
      )
      if (matchingConsumables.length === 1) {
        const matchingConsumable = matchingConsumables[0]
        const matchingConsumableReasons = yield* findConsumableReasons(
          { name: inventoryChange.ConsumableReasonName },
          knex
        )
        if (matchingConsumableReasons.length === 1) {
          const matchingConsumableReason = matchingConsumableReasons[0]

          if (matchingConsumableReason.decrease) {
            yield* decreaseInventory(
              device.siteId,
              matchingConsumable.id,
              inventoryChange.ExpirationDate,
              undefined,
              -inventoryChange.Quantity,
              matchingConsumableReason.id,
              inventoryChange.DateChanged,
              undefined,
              undefined,
              now,
              'remove from GxConnect',
              undefined,
              knex
            )
          } else {
            yield* increaseInventory(
              device.siteId,
              matchingConsumable.id,
              inventoryChange.ExpirationDate,
              undefined,
              inventoryChange.Quantity,
              matchingConsumableReason.id,
              inventoryChange.DateChanged,
              undefined,
              undefined,
              now,
              'add from GxConnect',
              undefined,
              knex
            )
          }
        }
      }
    }
  }
  return {}
}

module.exports = postProcessAddDeviceOperation
