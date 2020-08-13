const { assert } = require('chai')
const { getLocalDateTimeStringInUtc } = require('../../src/shared/date')

describe('Shared Date Utility Functions', () => {
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
