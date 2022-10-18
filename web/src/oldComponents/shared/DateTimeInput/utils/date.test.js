import getDaysInMonth from 'date-fns/getDaysInMonth'
import range from 'lodash/range'
import {
  getYearList,
  defaultYearList,
  getMonthList,
  defaultMonthList,
  getDateList,
  defaultDateList,
  getHourList,
  defaultHourList,
  getMinuteList,
  defaultMinuteList,
} from './date'

describe('getYearList', () => {
  it('should return a default year list if some of the given arguments are invalid', () => {
    expect(getYearList({ minDate: null, maxDate: null })).toEqual(defaultYearList)
    expect(getYearList({ minDate: null })).toEqual(defaultYearList)
    expect(getYearList({ maxDate: null })).toEqual(defaultYearList)
  })

  it('should return a year list between minDate and maxDate', () => {
    expect(
      getYearList({
        minDate: new Date('1990-2-25'),
        maxDate: new Date('2050-2-25'),
      })
    ).toEqual(range(1990, 2050 + 1))
  })
})

describe('getMonthList', () => {
  it('should return a default month list if some of the given arguments are invalid', () => {
    expect(getMonthList({ date: null })).toEqual(defaultMonthList)
    expect(getMonthList({ minDate: null })).toEqual(defaultMonthList)
    expect(getMonthList({ maxDate: null })).toEqual(defaultMonthList)
  })

  it('should return a month list that do not contain the months that smaller then minDate when the year of date is equal to minDate', () => {
    expect(
      getMonthList({
        date: new Date('2000-5-15'),
        minDate: new Date('1999-5-15'),
        maxDate: new Date('2001-5-15'),
      })
    ).toEqual(range(0, 12))
    expect(
      getMonthList({
        date: new Date('1999-5-15'),
        minDate: new Date('1999-5-15'),
        maxDate: new Date('2001-5-15'),
      })
    ).toEqual(range(5 - 1, 12))
    expect(
      getMonthList({
        date: new Date('2000-6-15'),
        minDate: new Date('2000-5-15'),
        maxDate: new Date('2020-5-15'),
      })
    ).toEqual(range(5 - 1, 12))
  })

  it('should return a month list that do not contain the months that bigger then maxDate when the year of date is equal to maxDate', () => {
    expect(
      getMonthList({
        date: new Date('2001-5-15'),
        minDate: new Date('1999-5-15'),
        maxDate: new Date('2001-5-15'),
      })
    ).toEqual(range(0, 5))
    expect(
      getMonthList({
        date: new Date('2020-1-15'),
        minDate: new Date('2000-5-15'),
        maxDate: new Date('2020-5-15'),
      })
    ).toEqual(range(0, 5))
  })
})

describe('getDateList', () => {
  it('should return a default date list if some of the given arguments are invalid', () => {
    expect(getDateList({ date: null })).toEqual(defaultDateList)
    expect(getDateList({ minDate: null })).toEqual(defaultDateList)
    expect(getDateList({ maxDate: null })).toEqual(defaultDateList)
    expect(getDateList({ date: new Date('2000-05-05'), minDate: null })).toEqual(
      range(1, getDaysInMonth(new Date('2000-05-05')) + 1)
    )
    expect(getDateList({ date: new Date('2000-05-05'), maxDate: null })).toEqual(
      range(1, getDaysInMonth(new Date('2000-05-05')) + 1)
    )
  })

  it('should return the days in month when the date between minDate and maxDate', () => {
    expect(
      getDateList({
        date: new Date('2000-5-15'),
        minDate: new Date('1999-5-15'),
        maxDate: new Date('2001-5-15'),
      })
    ).toEqual(range(1, getDaysInMonth(new Date('2000-5-15')) + 1))
    expect(
      getDateList({
        date: new Date('1999-12-22'),
        minDate: new Date('1900-1-1'),
        maxDate: new Date('2020-1-1'),
      })
    ).toEqual(range(1, getDaysInMonth(new Date('1999-12-22')) + 1))
  })

  it('should return the days in month when only the date of year is equal to minDate or maxDate', () => {
    // minDate
    expect(
      getDateList({
        date: new Date('1999-7-30'),
        minDate: new Date('1999-5-15'),
        maxDate: new Date('2001-5-15'),
      })
    ).toEqual(range(1, getDaysInMonth(new Date('1999-7-30')) + 1))
    expect(
      getDateList({
        date: new Date('2000-5-15'),
        minDate: new Date('2000-3-11'),
        maxDate: new Date('2020-3-11'),
      })
    ).toEqual(range(1, getDaysInMonth(new Date('2000-5-15')) + 1))

    // maxDate
    expect(
      getDateList({
        date: new Date('2001-3-30'),
        minDate: new Date('2-5-15'),
        maxDate: new Date('2001-5-15'),
      })
    ).toEqual(range(1, getDaysInMonth(new Date('2001-3-30')) + 1))
    expect(
      getDateList({
        date: new Date('2020-1-15'),
        minDate: new Date('2000-3-11'),
        maxDate: new Date('2020-3-11'),
      })
    ).toEqual(range(1, getDaysInMonth(new Date('2020-1-15')) + 1))
  })

  it('should return a date list that do not contain the dates that smaller then minDate when the year and month of date are equal to minDate', () => {
    expect(
      getDateList({
        date: new Date('1999-5-20'),
        minDate: new Date('1999-5-15'),
        maxDate: new Date('2001-5-15'),
      })
    ).toEqual(range(15, getDaysInMonth(new Date('1999-5-20')) + 1))
    expect(
      getDateList({
        date: new Date('2000-3-15'),
        minDate: new Date('2000-3-11'),
        maxDate: new Date('2020-3-11'),
      })
    ).toEqual(range(11, getDaysInMonth(new Date('2000-3-15')) + 1))
  })

  it('should return a date list that do not contain the dates that bigger then maxDate when the year and month of date are equal to maxDate', () => {
    expect(
      getDateList({
        date: new Date('2001-5-5'),
        minDate: new Date('1999-5-15'),
        maxDate: new Date('2001-5-15'),
      })
    ).toEqual(range(1, 15 + 1))
    expect(
      getDateList({
        date: new Date('2020-3-10'),
        minDate: new Date('2000-3-11'),
        maxDate: new Date('2020-3-11'),
      })
    ).toEqual(range(1, 11 + 1))
  })
})

describe('getHourList', () => {
  it('should return a default hour list if some of the given arguments are invalid', () => {
    expect(getHourList({ date: null })).toEqual(defaultHourList)
    expect(getHourList({ minDate: null })).toEqual(defaultHourList)
    expect(getHourList({ maxDate: null })).toEqual(defaultHourList)
  })

  it('should return a limited hour list when the year, month and date of the date are equal to minDate', () => {
    expect(
      getHourList({
        date: new Date('1999-05-15 20:20:21'),
        minDate: new Date('1999-05-15 19:20:21'),
        maxDate: new Date('2000-05-15 19:20:21'),
      })
    ).toEqual(range(19, 24))
    expect(
      getHourList({
        date: new Date('2000-03-18 12:20:21'),
        minDate: new Date('2000-03-18 10:20:21'),
        maxDate: new Date('2020-05-15 19:20:21'),
      })
    ).toEqual(range(10, 24))
  })

  it('should return a limited hour list when the year, month and date of the date are equal to maxDate', () => {
    expect(
      getHourList({
        date: new Date('2000-05-15 12:20:21'),
        minDate: new Date('1999-05-15 19:20:21'),
        maxDate: new Date('2000-05-15 19:20:21'),
      })
    ).toEqual(range(0, 19 + 1))
    expect(
      getHourList({
        date: new Date('2020-03-18 12:20:21'),
        minDate: new Date('2000-03-18 10:20:21'),
        maxDate: new Date('2020-03-18 17:20:21'),
      })
    ).toEqual(range(0, 17 + 1))
  })
})

describe('getMinuteList', () => {
  it('should return a default minute list if some of the given arguments are invalid', () => {
    expect(getMinuteList({ date: null })).toEqual(defaultMinuteList)
    expect(getMinuteList({ minDate: null })).toEqual(defaultMinuteList)
    expect(getMinuteList({ maxDate: null })).toEqual(defaultMinuteList)
  })

  it('should return a limited minute list when the year, month, date and hour of the date are equal to minDate', () => {
    expect(
      getMinuteList({
        date: new Date('1999-05-15 19:30:30'),
        minDate: new Date('1999-05-15 19:20:21'),
        maxDate: new Date('2000-05-15 19:20:21'),
      })
    ).toEqual(range(20, 60))
    expect(
      getMinuteList({
        date: new Date('2000-03-18 10:40:40'),
        minDate: new Date('2000-03-18 10:15:10'),
        maxDate: new Date('2020-05-15 19:20:21'),
      })
    ).toEqual(range(15, 60))
  })

  it('should return a limited minute list when the year, month, date and hour of the date are equal to maxDate', () => {
    expect(
      getMinuteList({
        date: new Date('2000-05-15 19:20:21'),
        minDate: new Date('1999-05-15 19:20:21'),
        maxDate: new Date('2000-05-15 19:40:21'),
      })
    ).toEqual(range(0, 40 + 1))
    expect(
      getMinuteList({
        date: new Date('2020-03-18 17:20:21'),
        minDate: new Date('2000-03-18 10:20:21'),
        maxDate: new Date('2020-03-18 17:30:21'),
      })
    ).toEqual(range(0, 30 + 1))
  })
})
