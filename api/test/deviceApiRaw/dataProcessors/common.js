const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const chai = require('chai')

const { expect } = chai

chai.use(deepEqualInAnyOrder)

const testMappings = (mappings, mappingConfiguration, testType) => {
  mappings.forEach(({ payload, resultData }) => {
    const { mapResultData } = mappingConfiguration[testType]
    const actualResult = mapResultData(payload)
    expect(resultData).to.deep.equalInAnyOrder(actualResult)
  })
}

module.exports = {
  testMappings,
}
