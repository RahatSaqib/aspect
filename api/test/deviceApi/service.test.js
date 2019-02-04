const { assert } = require('chai')
const _ = require('lodash')
//const { runTest } = require('../utils/generatorFunctionUtils')
const { getHealthStateHandler , getTestByCountry } = require('../../src/deviceApi/service')

describe.only('Device Api service', () => {
  it('Health Stats handler ', async () => {
   // const countries = await getHealthStateHandler()
    const devices = await getTestByCountry()
    assert.equal(devices.length, 2)
  //  assert.equal(countries.length, 1)
  })
})
