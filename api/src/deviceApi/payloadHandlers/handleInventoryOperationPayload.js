const { knex } = require('../../db')

const handleInventoryOperationPayload = async (request, deviceLogId) => {
  // Inventory operations are deprecated in GxConnect and are intentionally ignored.

  await knex('DeviceLog').where('id', deviceLogId).update({
    processed: true,
  })

  return {}
}

module.exports = {
  handleInventoryOperationPayload,
}
