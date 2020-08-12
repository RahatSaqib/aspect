const { assert } = require('chai')
const {
  getUtcTime,
  getLocalDateTimeStringInUtc,
} = require('../../src/shared/date')

describe('Shared Date Utility Functions', () => {
  describe('getUtcTime', () => {
    it('should return the local server time as it is at Coordinated Universal Time', () => {
      const localTime = new Date()
      const utcTime = getUtcTime(localTime)
      assert.equal(utcTime.getHours(), localTime.getUTCHours())
      assert.equal(utcTime.getMinutes(), localTime.getUTCMinutes())
    })
  })
  describe('getLocalDateTimeStringInUtc', () => {
    it('should return null if no date is passed', () => {
      const utcDateTime = getLocalDateTimeStringInUtc(null)
      assert.equal(utcDateTime, null)
    })

    it('should return null if something other than a string was passed', () => {
      const utcDateTime = getLocalDateTimeStringInUtc(new Date())
      assert.equal(utcDateTime, null)
    })

    it('should return datetime in UTC', () => {
      const utcDateTime = getLocalDateTimeStringInUtc(
        '2020-08-12T16:00:00.000',
        'Africa/Johannesburg'
      )
      assert.equal(utcDateTime.toISOString(), '2020-08-12T14:00:00.000Z')
    })
  })
})
