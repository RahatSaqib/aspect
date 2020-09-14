const { assert } = require('chai')

describe('test setup', () => {
  describe('TimeZone', () => {
    it('should be set to UTC (0 offset)', async () => {
      assert.equal(new Date().getTimezoneOffset(), 0)
    })
  })
})
