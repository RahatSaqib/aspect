const { assert } = require('chai')
const _ = require('lodash')
const { runTest } = require('../utils/generatorFunctionUtils')
const { getHealthStateHandler } = require('../../src/deviceApi/service')

describe.only('Device Api service', () => {
  it('Health Stats handler ', async () => {
    const countries = _.map(await getHealthStateHandler(), item =>  {
      item.Country, item.A2, item.A3, item.Date, item.Total
    })
    assert.equal(countries.length, 1)
  })
})
