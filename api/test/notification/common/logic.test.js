const { assert } = require('chai')
const { getDateRangeFilters } = require('../../../src/notification/common/logic')

describe('getDateRangeFilters Should return the correct date range', () => {
  it('PREVIOUS_CALENDAR_DAY', async () => {
    const case1 = getDateRangeFilters(new Date('2022-11-25T01:50:00.000Z'), 'PREVIOUS_CALENDAR_DAY', null)
    assert.deepEqual(case1, {
      minDate: '2022-11-24T00:00:00.000Z',
      maxDate: '2022-11-24T23:59:59.999Z',
    })

    const case2 = getDateRangeFilters(new Date('2022-12-31T23:59:59.999Z'), 'PREVIOUS_CALENDAR_DAY', null)
    assert.deepEqual(case2, {
      minDate: '2022-12-30T00:00:00.000Z',
      maxDate: '2022-12-30T23:59:59.999Z',
    })

    const case3 = getDateRangeFilters(new Date('2023-01-01T00:00:00.000Z'), 'PREVIOUS_CALENDAR_DAY', null)
    assert.deepEqual(case3, {
      minDate: '2022-12-31T00:00:00.000Z',
      maxDate: '2022-12-31T23:59:59.999Z',
    })

    const case4 = getDateRangeFilters(new Date('2022-11-21T23:59:59.999Z'), 'PREVIOUS_CALENDAR_DAY', null)
    assert.deepEqual(case4, {
      minDate: '2022-11-20T00:00:00.000Z',
      maxDate: '2022-11-20T23:59:59.999Z',
    })

    const leapYearCase = getDateRangeFilters(new Date('2024-03-01T23:59:59.999Z'), 'PREVIOUS_CALENDAR_DAY', null)
    assert.deepEqual(leapYearCase, {
      minDate: '2024-02-29T00:00:00.000Z',
      maxDate: '2024-02-29T23:59:59.999Z',
    })

    const notLeapYearCase = getDateRangeFilters(new Date('2023-03-01T23:59:59.999Z'), 'PREVIOUS_CALENDAR_DAY', null)
    assert.deepEqual(notLeapYearCase, {
      minDate: '2023-02-28T00:00:00.000Z',
      maxDate: '2023-02-28T23:59:59.999Z',
    })
  })

  it('PREVIOUS_WEEK_DAY', async () => {
    const case1 = getDateRangeFilters(new Date('2022-11-25T01:50:00.000Z'), 'PREVIOUS_WEEK_DAY', null)
    assert.deepEqual(case1, {
      minDate: '2022-11-24T00:00:00.000Z',
      maxDate: '2022-11-24T23:59:59.999Z',
    })

    const mondayCase = getDateRangeFilters(new Date('2022-11-21T23:59:59.999Z'), 'PREVIOUS_WEEK_DAY', null)
    assert.deepEqual(mondayCase, {
      minDate: '2022-11-18T00:00:00.000Z',
      maxDate: '2022-11-18T23:59:59.999Z',
    })

    const sundayCase = getDateRangeFilters(new Date('2022-11-20T23:59:59.999Z'), 'PREVIOUS_WEEK_DAY', null)
    assert.deepEqual(sundayCase, {
      minDate: '2022-11-18T00:00:00.000Z',
      maxDate: '2022-11-18T23:59:59.999Z',
    })

    const saturdayCase = getDateRangeFilters(new Date('2022-11-19T23:59:59.999Z'), 'PREVIOUS_WEEK_DAY', null)
    assert.deepEqual(saturdayCase, {
      minDate: '2022-11-18T00:00:00.000Z',
      maxDate: '2022-11-18T23:59:59.999Z',
    })
  })

  it('PREVIOUS_WEEK', async () => {
    const sundayCase1 = getDateRangeFilters(new Date('2022-11-25T01:50:00.000Z'), 'PREVIOUS_WEEK', 0)
    assert.deepEqual(sundayCase1, {
      minDate: '2022-11-13T00:00:00.000Z',
      maxDate: '2022-11-19T23:59:59.999Z',
    })

    const sundayCase2 = getDateRangeFilters(new Date('2022-12-31T23:59:59.999Z'), 'PREVIOUS_WEEK', 0)
    assert.deepEqual(sundayCase2, {
      minDate: '2022-12-18T00:00:00.000Z',
      maxDate: '2022-12-24T23:59:59.999Z',
    })

    const sundayCase3 = getDateRangeFilters(new Date('2023-01-01T00:00:00.000Z'), 'PREVIOUS_WEEK', 0)
    assert.deepEqual(sundayCase3, {
      minDate: '2022-12-25T00:00:00.000Z',
      maxDate: '2022-12-31T23:59:59.999Z',
    })

    const sundayCase4 = getDateRangeFilters(new Date('2023-01-02T00:00:00.000Z'), 'PREVIOUS_WEEK', 0)
    assert.deepEqual(sundayCase4, {
      minDate: '2022-12-25T00:00:00.000Z',
      maxDate: '2022-12-31T23:59:59.999Z',
    })

    const wednesdayCase = getDateRangeFilters(new Date('2022-11-25T01:50:00.000Z'), 'PREVIOUS_WEEK', 3)
    assert.deepEqual(wednesdayCase, {
      minDate: '2022-11-16T00:00:00.000Z',
      maxDate: '2022-11-22T23:59:59.999Z',
    })
  })

  it('PREVIOUS_7_DAYS', async () => {
    const case1 = getDateRangeFilters(new Date('2022-11-25T01:50:00.000Z'), 'PREVIOUS_7_DAYS', null)
    assert.deepEqual(case1, {
      minDate: '2022-11-18T00:00:00.000Z',
      maxDate: '2022-11-24T23:59:59.999Z',
    })

    const case2 = getDateRangeFilters(new Date('2023-01-01T00:00:00.000Z'), 'PREVIOUS_7_DAYS', null)
    assert.deepEqual(case2, {
      minDate: '2022-12-25T00:00:00.000Z',
      maxDate: '2022-12-31T23:59:59.999Z',
    })

    const case3 = getDateRangeFilters(new Date('2023-01-04T00:00:00.000Z'), 'PREVIOUS_7_DAYS', null)
    assert.deepEqual(case3, {
      minDate: '2022-12-28T00:00:00.000Z',
      maxDate: '2023-01-03T23:59:59.999Z',
    })
  })

  it('PREVIOUS_MONTH', async () => {
    const case1 = getDateRangeFilters(new Date('2022-11-25T01:50:00.000Z'), 'PREVIOUS_MONTH', null)
    assert.deepEqual(case1, {
      minDate: '2022-10-01T00:00:00.000Z',
      maxDate: '2022-10-31T23:59:59.999Z',
    })

    const case2 = getDateRangeFilters(new Date('2023-01-01T00:00:00.000Z'), 'PREVIOUS_MONTH', null)
    assert.deepEqual(case2, {
      minDate: '2022-12-01T00:00:00.000Z',
      maxDate: '2022-12-31T23:59:59.999Z',
    })

    const case3 = getDateRangeFilters(new Date('2022-12-31T23:59:59.999Z'), 'PREVIOUS_MONTH', null)
    assert.deepEqual(case3, {
      minDate: '2022-11-01T00:00:00.000Z',
      maxDate: '2022-11-30T23:59:59.999Z',
    })
  })

  it('PREVIOUS_QUARTER', async () => {
    const case1 = getDateRangeFilters(new Date('2022-11-25T01:50:00.000Z'), 'PREVIOUS_QUARTER', null)
    assert.deepEqual(case1, {
      minDate: '2022-07-01T00:00:00.000Z',
      maxDate: '2022-09-30T23:59:59.999Z',
    })

    const case2 = getDateRangeFilters(new Date('2023-01-01T00:00:00.000Z'), 'PREVIOUS_QUARTER', null)
    assert.deepEqual(case2, {
      minDate: '2022-10-01T00:00:00.000Z',
      maxDate: '2022-12-31T23:59:59.999Z',
    })

    const case3 = getDateRangeFilters(new Date('2022-12-31T23:59:59.999Z'), 'PREVIOUS_QUARTER', null)
    assert.deepEqual(case3, {
      minDate: '2022-07-01T00:00:00.000Z',
      maxDate: '2022-09-30T23:59:59.999Z',
    })
  })
})
