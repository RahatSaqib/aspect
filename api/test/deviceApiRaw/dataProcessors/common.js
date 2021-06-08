const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const chai = require('chai')

const { expect } = chai

chai.use(deepEqualInAnyOrder)

const testMappings = (mappings, mapResultDataFunc) => {
  mappings.forEach(({ payload, resultData }) => {
    const actualResult = mapResultDataFunc(payload)
    expect(resultData).to.deep.equalInAnyOrder(actualResult)
  })
}

module.exports = {
  testMappings,
}
