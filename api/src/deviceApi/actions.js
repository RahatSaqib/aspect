const types = {
  ASYNC_PAYLOAD_RECEIVED: 'ASYNC_PAYLOAD_RECEIVED',
}

function asyncPayloadReceived(deviceLogId, remoteAddress) {
  return {
    type: types.ASYNC_PAYLOAD_RECEIVED,
    deviceLogId,
    remoteAddress,
  }
}

module.exports = {
  types,
  asyncPayloadReceived,
}
