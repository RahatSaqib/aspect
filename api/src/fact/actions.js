// ----------- Action Types ---------------------
const types = {
  FACT_GENERATE: 'FACT_GENERATE',
}

// Optionally discriminates types of facts to generateno
// Defined to allow internal specialization and to share queue
// Normally should simply add actoin types
const factTypes = {
  DEVICE_OFFLINE: 'DEVICE_OFFLINE',
  DEVICE_NO_RESULTS: 'DEVICE_NO_RESULTS',
  RESULT_COUNTS: 'RESULT_COUNTS',
}

// ----------- Action Creators -------------------

/**
 * Requests fact device flags to be regenerated. Will be called on
 * schedule to run fact device flag ETL
 *
 * factType: optional, e.g. offline, service, calibration. If not
 * specified will create new actions for each of known flags
 * deviceId: optional, if specified, request facts to be generated
 * for a specific device.
 * options: additional options, specific to the fact type,
 * intended for internal use of the fact service
 */
function factGenerate(factType, deviceId, options) {
  return {
    type: types.FACT_GENERATE,
    factType,
    deviceId,
    options,
  }
}

module.exports = {
  types,
  factTypes,
  factGenerate,
}
