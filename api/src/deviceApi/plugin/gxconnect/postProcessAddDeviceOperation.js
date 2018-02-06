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

async function postProcessAddDeviceOperation(context) {
  const { payload, device, now } = context
  const inventoryChanges = _.get(payload, 'data.inventoryChanges')
  if (!_.isEmpty(inventoryChanges)) {
    const sortedInventoryChanges = _.sortBy(
      inventoryChanges,
      inventoryChange => new Date(inventoryChange.dateChanged)
    )
    await Promise.all(
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
            const changeFunction = isDecrease
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
              expiresOn: inventoryChange.expirationDate
                ? new Date(inventoryChange.expirationDate)
                : null,
              quantity: absoluteQuantity,
              quantityOnHand: inventoryChange.resultingQuantityOnHand,
              reasonId: matchingConsumableReason.id,
              dateAdjustedFrom: inventoryChange.dateChanged
                ? setMilliseconds(new Date(inventoryChange.dateChanged), 0)
                : null,
              now,
            }
            changeParameters.operation = isDecrease
              ? 'remove from GxConnect'
              : 'add from GxConnect'
            await changeFunction(changeParameters)
          }
        }
      })
    )
  }
  return {}
}

module.exports = postProcessAddDeviceOperation
