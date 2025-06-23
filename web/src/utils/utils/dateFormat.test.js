import { formatDateTime, formatDate } from './dateFormat'

describe('date format functions', () => {
  describe('formatBase function', () => {
    it('should format date and time without shifting it due to timezone', () => {
      const UTC = '2020-09-15T14:03:23.000Z'
      const expected = '2020-09-15 14:03:23'
      expect(formatDateTime(UTC)).toEqual(expected)
    })

    it('should format date without shifting it due to timezone', () => {
      const UTC = '2020-09-15T23:59:59.000Z'
      const expected = '2020-09-15'
      expect(formatDate(UTC)).toEqual(expected)
    })
  })
})
