const { postProcessAddDeviceOperation: geneXpertPostProcessAddDeviceOperation } = require('../gxUtils')
const { getInventoryItems } = require('../../../inventory/common/db')

async function postProcessAddDeviceOperation(context) {
  const { inventoryItemIds } = await geneXpertPostProcessAddDeviceOperation(context)
  return {
    inventoryItems: await getInventoryItems(inventoryItemIds),
  }
}

module.exports = postProcessAddDeviceOperation
