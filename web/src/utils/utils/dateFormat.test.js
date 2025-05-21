import { formatDate, formatDateTimeWithoutTimezone, formatDateWithoutTimezone } from './dateFormat'

describe('date format functions', () => {
  describe('formatBase function', () => {
    it('should format date and time without shifting it due to timezone', () => {
      const UTC = '2020-09-15T14:03:23.000Z'
      const expected = '2020-09-15 14:03:23'
      expect(formatDateTimeWithoutTimezone(UTC)).toEqual(expected)
    })

    it('should format date without shifting it due to timezone', () => {
      const UTC = '2020-09-15T23:59:59.000Z'
      const expected = '2020-09-15'
      expect(formatDateWithoutTimezone(UTC)).toEqual(expected)
    })

    it('should format the date from UTC correctly', () => {
      const UTC = '2019-08-28T19:13:03.000Z'
      const expected = '2019-08-28'
      expect(formatDate(UTC)).toEqual(expected)
    })
  })
})
