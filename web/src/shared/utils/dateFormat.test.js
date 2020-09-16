import { formatDate, formatTime, formatDateTime } from './dateFormat'

describe('date format functions', () => {
  describe('formatBase function', () => {
    it('should format the date and time from UTC correctly', () => {
      const UTC = '2020-09-15T14:03:23.000Z'
      const expected = '2020-09-15 16:03:23'
      expect(formatDateTime(UTC)).toEqual(expected)
    })

    it('should format the time from UTC correctly, taking DST into account', () => {
      const UTC = '2019-12-03T09:15:18.000Z'
      const expected = '10:15:18'
      expect(formatTime(UTC)).toEqual(expected)
    })

    it('should format the date from UTC correctly', () => {
      const UTC = '2019-08-28T19:13:03.000Z'
      const expected = '2019-08-28'
      expect(formatDate(UTC)).toEqual(expected)
    })
  })
})
