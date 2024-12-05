// GxConnect does not require any data in the result response.
// However, we decided to retain the aspectResultId and the device.id in the response to aid in troubleshooting.
// In the future, we plan to remove it to enable asynchronous result processing.
// The device is removed to minimize network data usage.
function transformMergeResultResponse(response) {
  const { device, ...restOfResponse } = response
  const transformedResponse = { ...restOfResponse }

  if (device) {
    transformedResponse.device = { id: device.id }
  }

  return transformedResponse
}

module.exports = transformMergeResultResponse
