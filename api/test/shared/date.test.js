const { assert } = require('chai')
const { getUtcTime } = require('../../src/shared/date')

describe('Shared Date Utility Functions', () => {
  it('should return the local server time as it is at Coordinated Universal Time', () => {
    const localTime = new Date()
    const utcTime = getUtcTime(localTime)
    assert.equal(utcTime.getHours(), localTime.getUTCHours())
    assert.equal(utcTime.getMinutes(), localTime.getUTCMinutes())
  })
})
