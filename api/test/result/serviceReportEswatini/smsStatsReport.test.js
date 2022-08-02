const { assert } = require('chai')
const { humanDuration } = require('../../../src/result/serviceReportEswatini/smsStatsReport')

const min = 60
const hour = 60 * min

describe('humanDuration', () => {
  it('should return valid duration descriptions between year and minute', async () => {
    assert.equal(humanDuration(hour), '1 hour')
    assert.equal(humanDuration(hour + 5 * min), '1 hour 5 minutes')
    assert.equal(humanDuration(5 * hour), '5 hours')
    assert.equal(humanDuration(24 * hour), '1 day')
    assert.equal(humanDuration(24 * hour + 5 * min), '1 day 5 minutes')
    assert.equal(humanDuration(24 * hour + hour + 9 * min), '1 day 1 hour 9 minutes')
  })
})

describe('humanDuration', () => {
  it('should return "-" for invalid inputs', async () => {
    assert.equal(humanDuration(24 * hour * 32), '-')
    assert.equal(humanDuration(0), '-')
    assert.equal(humanDuration('fdsafafasd'), '-')
  })
})
