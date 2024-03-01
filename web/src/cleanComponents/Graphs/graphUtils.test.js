import endOfDay from 'date-fns/endOfDay'
import startOfDay from 'date-fns/startOfDay'
import { getMinMaxDateFromMonthString } from './graphUtils'

describe('getMinMaxDateFromMonthString', () => {
  it('Should return the min and max dates from the provided month', () => {
    const input = '2024-01'

    const expected = {
      minDate: startOfDay(new Date('2024-01-01')), // 2023-12-31T23:00:00.000Z
      maxDate: endOfDay(new Date('2024-01-31')), // 2024-01-31T22:59:59.999Z
    }

    const dates = getMinMaxDateFromMonthString(input)
    expect(dates.minDate).toEqual(expected.minDate)
    expect(dates.maxDate).toEqual(expected.maxDate)
  })
})
