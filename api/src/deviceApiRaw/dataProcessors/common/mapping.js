/**
 * Builds and returns a function that let you map a payload to the corresponding resultData object.
 * IMPORTANT! When calling the builded function, you must specify the payload and the testType (one of 'dst', 'culture', 'smear', 'genexpert', 'tblamp', 'lpa').
 * If the payload does not correspond to the provided testType, then false will be returned.
 * @param {object} mappingConfiguration The mapping configuration of the source. Ex.: { dst: { mapping: payload => { return ... }, validate: (payload, resultData) => { return true/false ... } } }
 * @returns The function for mapping payloads to resultData
 */
const getResultDataMapper = mappingConfiguration => {
  return (payload, testType) => {
    testType = testType.toLowerCase()
    let result = false

    const config = mappingConfiguration[testType]
    if (config) {
      const { map, validate } = config
      const resultData = map(payload)
      if (validate(resultData, payload)) result = resultData
    }

    return result
  }
}

module.exports = {
  getResultDataMapper,
}
