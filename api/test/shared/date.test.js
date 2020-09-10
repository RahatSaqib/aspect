const { assert } = require('chai')

const {
  getLocalDateTimeStringInUtc,
  getArrayOfDaysInRange,
  getLocalDateInUtc,
  getTimeZoneById,
  formatDateOrDefault,
  startOfDayUtc,
  startOfTodayUtc,
} = require('../../src/shared/date')

describe('Shared Date Utility Functions', () => {
  describe('getLocalDateTimeStringInUtc', () => {
    it('should return null if no date is passed', () => {
      const utcDateTime = getLocalDateTimeStringInUtc(null)
      assert.isNull(utcDateTime)
    })

    it('should return null if something other than a string was passed', () => {
      const utcDateTime = getLocalDateTimeStringInUtc(new Date())
      assert.isNull(utcDateTime)
    })

    it('should return datetime in UTC', () => {
      const utcDateTime = getLocalDateTimeStringInUtc(
        '2020-08-12T16:00:00.000',
        'Africa/Johannesburg'
      )
      assert.equal(utcDateTime.toISOString(), '2020-08-12T14:00:00.000Z')
    })
  })

  describe('getArrayOfDaysInRange', () => {
    it('should return an array of dates in the given time range', () => {
      const arrayOfDays = getArrayOfDaysInRange(
        new Date(2020, 7, 1),
        new Date(2020, 7, 31)
      )

      assert.equal(arrayOfDays.length, 31)
      assert.equal(arrayOfDays[0].getTime(), new Date(2020, 7, 1).getTime())
      assert.equal(arrayOfDays[30].getTime(), new Date(2020, 7, 31).getTime())
    })
  })

  describe('getLocalDateInUtc', () => {
    it('should return the UTC equivalent of the given local datetime', () => {
      const utcDateTime = getLocalDateInUtc(
        new Date('2020-08-02T02:00:00.000+04:00')
      )

      assert.equal(utcDateTime.toISOString(), '2020-08-01T22:00:00.000Z')
    })
  })

  describe('getTimeZoneById', () => {
    it('should return the standard time zone identifier when given a timezone ID', () => {
      const timeZones = {
        'America/Bahia': 'Bahia Standard Time',
        'Asia/Dhaka': 'Bangladesh Standard Time',
        'America/New_York': 'Eastern Standard Time',
        'Africa/Cairo': 'Egypt Standard Time',
        'Asia/Yekaterinburg': 'Ekaterinburg Standard Time',
      }

      const timeZone = getTimeZoneById(timeZones, 'Eastern Standard Time')

      assert.equal(timeZone, 'America/New_York')
    })
  })

  describe('formatDateOrDefault', () => {
    describe('when no format is specified and date is in a non-UTC timezone', () => {
      it('should return the date in UTC', () => {
        assert.equal(
          formatDateOrDefault(new Date('2020-08-02T02:00:00.000+04:00')),
          '2020-08-01'
        )
        assert.equal(
          formatDateOrDefault(new Date('2020-07-31T22:00:00.000-04:00')),
          '2020-08-01'
        )
      })
    })

    describe('when no format is specified and date is in the UTC timezone', () => {
      it('should return the date in UTC', () => {
        assert.equal(
          formatDateOrDefault(new Date(2020, 7, 1, 12, 34, 56)),
          '2020-08-01'
        )
      })
    })

    describe('when format is specified and date is in a non-UTC timezone', () => {
      it('should return the date in UTC', () => {
        assert.equal(
          formatDateOrDefault(
            new Date('2020-08-02T02:00:00.000+04:00'),
            'MM/dd/yyyy'
          ),
          '08/01/2020'
        )
        assert.equal(
          formatDateOrDefault(
            new Date('2020-07-31T22:00:00.000-04:00'),
            'yyyy-MM-dd HH:mm:ss'
          ),
          '2020-08-01 02:00:00'
        )
      })
    })

    describe('when format is specified and date is in the UTC timezone', () => {
      it('should return the date in UTC', () => {
        assert.equal(
          formatDateOrDefault(
            new Date('2020-08-01T12:34:56.000Z'),
            'yyyy-MM-dd HH:mm:ss'
          ),
          '2020-08-01 12:34:56'
        )
      })
    })
  })

  describe('startOfDayUtc', () => {
    it('should return the start of the given day in UTC, ignoring server time', () => {
      assert.equal(
        startOfDayUtc(new Date('2020-08-02T01:23:45')).toISOString(),
        '2020-08-02T00:00:00.000Z'
      )
    })
  })

  describe('startOfTodayUtc', () => {
    it('should return the start of today in UTC, ignoring server time', () => {
      assert.equal(
        startOfTodayUtc().toISOString(),
        startOfDayUtc(new Date()).toISOString()
      )
    })
  })
})
