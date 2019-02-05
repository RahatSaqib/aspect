const { assert } = require('chai')
// const { runTest } = require('../utils/generatorFunctionUtils')
const { getHealthStateHandler } = require('../../src/deviceApi/service')

describe.only('Device Api service', () => {
  it('Health Stats handler ', async () => {
    // const countries = await getHealthStateHandler()
    const result = await getHealthStateHandler()
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result))
    assert.equal(result.length, 2)
    //  assert.equal(countries.length, 1)
  })
})
