// ----------- Action Types ---------------------
const types = {
  FACT_GENERATE: 'FACT_GENERATE',
  FACT_GENERATE_RESULT_COUNTS: 'FACT_GENERATE_RESULT_COUNTS',
  FACT_GENERATE_RESULT_COUNTS_FOR_DEVICE:
    'FACT_GENERATE_RESULT_COUNTS_FOR_DEVICE',
}

/**
 * Requests fact device flags to be regenerated. Will be called on
 * schedule to run fact device flag ETL
 *
 * factType: optional, e.g. offline, service, calibration. If not
 * specified will create new actions for each of known flags
 * deviceId: optional, if not specified, will generate flags
 * for all devices.
 */
function factGenerate(factType, deviceId) {
  return {
    type: types.FACT_GENERATE,
    factType,
    deviceId,
  }
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

module.exports = {
  types,
  factGenerate,
  factGenerateResultCounts,
  factGenerateResultCountsForDevice,
}
