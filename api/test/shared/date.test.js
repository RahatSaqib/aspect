const { assert } = require('chai')

const {
  getLocalDateTimeStringInUtc,
  getArrayOfDaysInRange,
  getLocalDateInUtc,
  getTimeZoneById,
  formatDateOrDefault,
  startOfDayUtc,
  startOfMonthUTC,
  endOfMonthUTC,
  startOfTodayUtc,
  REGEX_ISODATESTRING,
  getOffsetFromIsoDateString,
  getOffsetFromTimeZone,
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

  describe('getIsoDateTimeStringRegex', () => {
    it('should parse different iso format datetime strings', () => {
      assert.isTrue(REGEX_ISODATESTRING.test('2020-08-01T22:00:00.000Z'))
      assert.isTrue(REGEX_ISODATESTRING.test('2020-08-01T22:00:00-00:00'))
      assert.isTrue(REGEX_ISODATESTRING.test('2020-08-01T22:00:00+01:00'))
      assert.isTrue(REGEX_ISODATESTRING.test('2020-08-01T22:00:00.000-04:00'))
      assert.isTrue(REGEX_ISODATESTRING.test('2020-08-01T22:00:00.000Z'))
      assert.isTrue(
        REGEX_ISODATESTRING.test('2020-08-01T22%3A00%3A00.000%2B01%3A00')
      )
      assert.isTrue(
        REGEX_ISODATESTRING.test('2020-08-01T22%3A00%3A00.000-01%3A00')
      )

      assert.isFalse(REGEX_ISODATESTRING.test('2020-08-01T22:00:00+3:00'))
      assert.isFalse(REGEX_ISODATESTRING.test('2020-08-01 22:00:00+03:00'))
      assert.isFalse(REGEX_ISODATESTRING.test('2020-08-0122:00:00+3:00'))
    })
  })

  describe('end/start of month in UTC', () => {
    it('startOfMonthUTC', () => {
      assert.equal(
        startOfMonthUTC('2020-08-02T02:00:00.000-03:00').toISOString(),
        '2020-08-01T03:00:00.000Z'
      )
      assert.equal(
        startOfMonthUTC('2020-08-02T02:00:00.000+06:00').toISOString(),
        '2020-07-31T18:00:00.000Z'
      )
      assert.equal(
        startOfMonthUTC('2020-08-02T02:00:00.000+03:00').toISOString(),
        '2020-07-31T21:00:00.000Z'
      )
      assert.equal(
        startOfMonthUTC('2020-08-02T02:00:00.000-05:00').toISOString(),
        '2020-08-01T05:00:00.000Z'
      )
    })
    it('endOfMonthUTC', () => {
      assert.equal(
        endOfMonthUTC('2020-08-02T02:00:00.000-03:00').toISOString(),
        '2020-09-01T02:59:59.999Z'
      )
      assert.equal(
        endOfMonthUTC('2020-08-02T02:00:00.000+06:00').toISOString(),
        '2020-08-31T17:59:59.999Z'
      )
      assert.equal(
        endOfMonthUTC('2020-08-02T02:00:00.000+03:00').toISOString(),
        '2020-08-31T20:59:59.999Z'
      )
      assert.equal(
        endOfMonthUTC('2020-08-02T02:00:00.000-05:00').toISOString(),
        '2020-09-01T04:59:59.999Z'
      )
    })
  })
  describe('getOffsetFromIsoDateString', () => {
    it('should obtain the offset of the received datetime ', () => {
      assert.equal(
        getOffsetFromIsoDateString('2020-08-01T22:00:00.000-04:00'),
        '-04:00'
      )
      assert.equal(
        getOffsetFromIsoDateString('2020-08-01T22:00:00.000+00:00'),
        '+00:00'
      )
      assert.equal(
        getOffsetFromIsoDateString('2020-08-01T22:00:00-03:00'),
        '-03:00'
      )
      assert.equal(
        getOffsetFromIsoDateString('2020-08-01T22:00:00.000-04:00'),
        '-04:00'
      )
      assert.equal(
        getOffsetFromIsoDateString('2020-08-01T22:00:00.000+11:00'),
        '+11:00'
      )
      assert.equal(
        getOffsetFromIsoDateString('2020-08-01T22:00:00.000-00:00'),
        '-00:00'
      )
      assert.equal(
        getOffsetFromIsoDateString('2020-08-01T22:00:00.000Z'),
        '+00:00'
      )
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

  describe('getOffsetFromTimeZone', () => {
    it('should return correct offSet from given timeZone', () => {
      const tzFixtures = [
        { tz: 'America/Buenos_Aires', expectedOffset: '-03:00', obs: '' },
        { tz: 'Asia/Baku', expectedOffset: '+04:00', obs: '' },
        { tz: 'Pacific/Fiji', expectedOffset: '+12:00', obs: '' },
        { tz: 'GMT', expectedOffset: '+00:00', obs: '' },
        {
          tz: 'Canada/Atlantic',
          expectedOffset: '+00:00',
          obs: ' (This timeZone must fail to be parsed, and should default to +00:00)',
        },
      ]

      for (const f of tzFixtures) {
        assert.equal(
          getOffsetFromTimeZone(f.tz),
          f.expectedOffset,
          `Cannot infer offSet from timeZone '${f.tz}'${f.obs}`
        )
      }
    })
  })
})
