const {
  postProcessAddDeviceOperation: geneXpertPostProcessAddDeviceOperation,
} = require('../gxUtils')
const { getInventoryItems } = require('../../../../inventory/service')

async function postProcessAddDeviceOperation(context) {
  const { inventoryItemIds } = await geneXpertPostProcessAddDeviceOperation(
    context
  )
  return {
    inventoryItems: await getInventoryItems(inventoryItemIds),
  }
}

module.exports = postProcessAddDeviceOperation
