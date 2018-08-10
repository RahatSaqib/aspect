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
const { parseDateOrDefault } = require('../../../shared/date')

async function postProcessAddDeviceOperation({ device, payload, now }) {
  let inventoryItemIds = []
  const inventoryChanges = _.get(payload, 'data.inventoryChanges')
  if (!_.isEmpty(inventoryChanges)) {
    const sortedInventoryChanges = _.sortBy(inventoryChanges, inventoryChange =>
      parseDateOrDefault(inventoryChange.dateChanged)
    )
    inventoryItemIds = await Promise.all(
      _.map(sortedInventoryChanges, async inventoryChange => {
        const matchingConsumables = await findConsumables({
          name: inventoryChange.consumableName,
        })
        if (matchingConsumables.length === 1) {
          const matchingConsumable = matchingConsumables[0]
          const matchingConsumableReason = await findConsumableReason(
            inventoryChange.consumableReasonName
          )
          if (matchingConsumableReason) {
            const absoluteQuantity = Math.abs(inventoryChange.quantity)
            const isDecrease =
              (matchingConsumableReason.reset &&
                inventoryChange.quantity < 0) ||
              matchingConsumableReason.decrease
            const adjustInventory = isDecrease
              ? decreaseInventory
              : increaseInventory
            if (!device.siteId && device.id) {
              const deviceData = await getDevice(device.id)
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
              expiresOn: parseDateOrDefault(inventoryChange.expirationDate),
              quantity: absoluteQuantity,
              quantityOnHand: inventoryChange.resultingQuantityOnHand,
              reasonId: matchingConsumableReason.id,
              dateAdjustedFrom: inventoryChange.dateChanged
                ? setMilliseconds(
                    parseDateOrDefault(inventoryChange.dateChanged),
                    0
                  )
                : null,
              now,
            }
            changeParameters.operation = isDecrease
              ? 'remove from GxConnect'
              : 'add from GxConnect'
            return adjustInventory(changeParameters)
          }
        }
        return -1
      })
    )
  }
  return {
    inventoryItemIds: _.filter(inventoryItemIds, id => id > 0),
  }
}

module.exports = postProcessAddDeviceOperation
