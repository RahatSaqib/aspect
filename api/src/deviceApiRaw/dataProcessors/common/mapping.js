const testTypes = {
  GENEXPERT: 'genexpert',
  TBLAMP: 'tblamp',
  SMEAR: 'smear',
  CULTURE: 'culture',
  DST: 'dst',
  LPA: 'lpa',
}

const getTestTypesValues = () => {
  const values = []
  Object.keys(testTypes).forEach(ttKey => values.push(testTypes[ttKey]))
  return values
}

/**
 * Builds and returns a function that let you map a payload to the corresponding resultData object.
 * IMPORTANT! When calling the builded function, you must specify the payload and the testType (one of 'dst', 'culture', 'smear', 'genexpert', 'tblamp', 'lpa').
 * If the payload does not correspond to the provided testType, then false will be returned.
 * @param {object} mappingConfiguration The mapping configuration of the source. Ex.: { dst: { mapping: payload => { return ... }, validate: (payload, resultData) => { return true/false ... } } }
 * @returns The function for mapping payloads to resultData
 */
const getResultDataMapper = mappingConfiguration => {
  const testTypesValues = getTestTypesValues()

  return payload => {
    let result = false

    let i = 0
    while (!result && i < testTypesValues.length) {
      const config = mappingConfiguration[testTypesValues[i]]
      if (config) {
        const { mapResultData, isPayloadValid } = config
        if (isPayloadValid(payload))
          result = { ...mapResultData(payload), testType: testTypesValues[i] }
      }
      i += 1
    }

    return result
  }
}

module.exports = {
  getResultDataMapper,
  testTypes,
}
