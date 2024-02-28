import { getMinMaxDateFromMonthString } from './graphUtils'

describe.only('getMinMaxDateFromMonthString', () => {
  it.only('Should return the min and max dates from the provided month', () => {
    const input = '2024-01-01'
    const expected = {
      minDate: new Date('2024-01-01T00:00:00.000+01:00'),
      maxDate: new Date('2024-01-31T23:59:59.999+01:00'),
    }
    const dates = getMinMaxDateFromMonthString(input)
    expect(dates).toDeepEqual(expected)
    expect(dates).toDeepEqual(expected)
  })
})
