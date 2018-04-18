// ----------- Action Types ---------------------
const types = {
  FACT_GENERATE_RESULT_COUNTS: 'FACT_GENERATE_RESULT_COUNTS',
  FACT_GENERATE_DEVICE_OFFLINE: 'FACT_GENERATE_DEVICE_OFFLINE',
  FACT_GENERATE_RESULT_COUNTS_FOR_DEVICE:
    'FACT_GENERATE_RESULT_COUNTS_FOR_DEVICE',
}

// ----------- Action Creators -------------------

/**
 * Requests facts to be regenerated. Will be called on
 * schedule to run fact ETL
 */
function factGenerateResultCounts() {
  return {
    type: types.FACT_GENERATE_RESULT_COUNTS,
  }
}

/**
 * Requests facts to be regenerated. Will be called on
 * schedule to run fact ETL
 */
function factGenerateResultCountsForDevice(deviceId, assayId, resultCategory1) {
  if (deviceId == null) {
    throw new Error(
      'Must specify deviceId for factGenerateResultCountsForDevice'
    )
  }
  return {
    type: types.FACT_GENERATE_RESULT_COUNTS_FOR_DEVICE,
    deviceId,
    assayId,
    resultCategory1,
  }
}

/**
 * Requests facts to be regenerated. Will be called on
 * schedule to run fact ETL
 */
function factGenerateDeviceOffline() {
  return {
    type: types.FACT_GENERATE_DEVICE_OFFLINE,
  }
}

module.exports = {
  types,
  factGenerateResultCounts,
  factGenerateResultCountsForDevice,
  factGenerateDeviceOffline,
}
