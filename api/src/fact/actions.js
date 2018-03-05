// ----------- Action Types ---------------------
const types = {
  FACT_GENERATE: 'FACT_GENERATE',
}

// ----------- Action Creators -------------------

/**
 * Requests facts to be regenerated. Will be called on
 * schedule to run fact ETL
 */
function factGenerate() {
  return {
    type: types.FACT_GENERATE,
  }
}

module.exports = {
  types,
  factGenerate,
}
