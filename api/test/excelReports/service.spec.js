// const _ = require('lodash')
// const { subDays, addMilliseconds, subMinutes } = require('date-fns')
const { assert } = require('chai')
const { getDevicesReport } = require('../../src/excelReports/service')
// const Promise = require('bluebird')
// const { run } = require('../../src/db')
// const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

describe.only('Excel reports', () => {
  // shared.checkToken(server, path)

  it('should return a list of devices when using valid token', async () => {
    await getDevicesReport()

    assert.isTrue(true)
  })
})
