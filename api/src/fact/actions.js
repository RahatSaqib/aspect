// ----------- Action Types ---------------------
const types = {
  FACT_GENERATE_RESULT_COUNTS: 'FACT_GENERATE_RESULT_COUNTS',
  FACT_GENERATE_DEVICE_OFFLINE: 'FACT_GENERATE_DEVICE_OFFLINE',
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
function factGenerateDeviceOffline() {
  return {
    type: types.FACT_GENERATE_DEVICE_OFFLINE,
  }
}

module.exports = {
  types,
  factGenerateResultCounts,
  factGenerateDeviceOffline,
}
