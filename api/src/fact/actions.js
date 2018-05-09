// ----------- Action Types ---------------------
const types = {
  FACT_GENERATE_DEVICE_CONNECTIVITY: 'FACT_GENERATE_DEVICE_CONNECTIVITY',
  FACT_GENERATE_RESULT_COUNTS: 'FACT_GENERATE_RESULT_COUNTS',
}

/**
 * Requests fact device flags to be regenerated for device connectivity.
 * Will be called on schedule to run fact device flag ETL
 *
 * deviceId: optional, if specified, request facts to be generated
 * for a specific device.
 * options: additional options, specific to the fact type,
 * intended for internal use of the fact service
 */
function factGenerateDeviceConnectivity(deviceId, options) {
  return {
    type: types.FACT_GENERATE_DEVICE_CONNECTIVITY,
    deviceId,
    options,
  }
}

/**
 * Requests fact device flags to be regenerated. Will be called on
 * schedule to run fact device flag ETL
 *
 * deviceId: optional, if specified, request facts to be generated
 * for a specific device.
 * options: additional options, specific to the fact type,
 * intended for internal use of the fact service
 */
function factGenerateResultCounts(deviceId, options) {
  return {
    type: types.FACT_GENERATE_RESULT_COUNTS,
    deviceId,
    options,
  }
}

module.exports = {
  types,
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
}
