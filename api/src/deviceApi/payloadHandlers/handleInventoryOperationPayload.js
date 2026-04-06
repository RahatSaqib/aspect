const handleInventoryOperationPayload = async (/* request, deviceLogId, remoteAddress */) => {
  // Inventory operations are deprecated in GxConnect and are intentionally ignored.
  return {}
}

module.exports = {
  handleInventoryOperationPayload,
}
