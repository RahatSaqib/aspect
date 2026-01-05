const types = {
  ASYNC_PAYLOAD_RECEIVED: 'ASYNC_PAYLOAD_RECEIVED',
}

function asyncPayloadReceived(deviceLogId) {
  return {
    type: types.ASYNC_PAYLOAD_RECEIVED,
    deviceLogId,
  }
}

module.exports = {
  types,
  asyncPayloadReceived,
}
