const Boom = require('@hapi/boom')
const {
  subDays,
  startOfDay,
  endOfDay,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} = require('date-fns')

function getDateRangeFilters(executionDate, reportDateRange, reportStartingWeekDay) {
  if (reportStartingWeekDay && reportDateRange !== 'PREVIOUS_WEEK') {
    throw new Boom.badData(`The reportDateRange type: ${reportDateRange} doesn't support reportStartingWeekDay`)
  }
  const dateRange = {}
  switch (reportDateRange) {
    case 'PREVIOUS_CALENDAR_DAY':
      dateRange.minDate = startOfDay(subDays(executionDate, 1))
      dateRange.maxDate = endOfDay(subDays(executionDate, 1))
      break
    case 'PREVIOUS_WEEK_DAY': {
      const daysToSubstract = {
        0: 2, // Sunday
        1: 3, // Monday
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 1, // Saturday
      }
      dateRange.minDate = startOfDay(subDays(executionDate, daysToSubstract[executionDate.getDay()]))
      dateRange.maxDate = endOfDay(subDays(executionDate, daysToSubstract[executionDate.getDay()]))
      break
    }
    case 'PREVIOUS_WEEK':
      dateRange.minDate = startOfWeek(subDays(executionDate, 7), { weekStartsOn: reportStartingWeekDay })
      dateRange.maxDate = endOfWeek(subDays(executionDate, 7), { weekStartsOn: reportStartingWeekDay })
      break
    case 'PREVIOUS_7_DAYS':
      dateRange.minDate = startOfDay(subDays(executionDate, 7))
      dateRange.maxDate = endOfDay(subDays(executionDate, 1))
      break
    case 'PREVIOUS_MONTH':
      dateRange.minDate = startOfMonth(subMonths(executionDate, 1))
      dateRange.maxDate = endOfMonth(subMonths(executionDate, 1))
      break
    case 'PREVIOUS_QUARTER':
      {
        const quarter = Math.floor(executionDate.getMonth() / 3)

        const startFullQuarter = new Date(executionDate.getFullYear(), quarter * 3 - 3, 1)
        const endFullQuarter = new Date(startFullQuarter.getFullYear(), startFullQuarter.getMonth() + 3, 0)

        dateRange.minDate = startOfDay(startFullQuarter)
        dateRange.maxDate = endOfDay(endFullQuarter)
      }
      break
    default:
      throw new Boom.badData(`Invalid reportDateRange type: ${reportDateRange}`)
  }
  return { minDate: dateRange.minDate.toISOString(), maxDate: dateRange.maxDate.toISOString() }
}

module.exports = {
  getDateRangeFilters,
}
