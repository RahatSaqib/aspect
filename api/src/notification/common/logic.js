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

  switch (reportDateRange) {
    case 'PREVIOUS_CALENDAR_DAY':
      return {
        minDate: startOfDay(subDays(executionDate, 1)),
        maxDate: endOfDay(subDays(executionDate, 1)),
      }
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

      return {
        minDate: startOfDay(subDays(executionDate, daysToSubstract[executionDate.getDay()])),
        maxDate: endOfDay(subDays(executionDate, daysToSubstract[executionDate.getDay()])),
      }
    }
    case 'PREVIOUS_WEEK':
      return {
        minDate: startOfWeek(subDays(executionDate, 7), { weekStartsOn: reportStartingWeekDay }),
        maxDate: endOfWeek(subDays(executionDate, 7), { weekStartsOn: reportStartingWeekDay }),
      }
    case 'PREVIOUS_7_DAYS':
      return {
        minDate: startOfDay(subDays(executionDate, 7)),
        maxDate: endOfDay(subDays(executionDate, 1)),
      }
    case 'PREVIOUS_MONTH':
      return {
        minDate: startOfMonth(subMonths(executionDate, 1)),
        maxDate: endOfMonth(subMonths(executionDate, 1)),
      }
    case 'PREVIOUS_QUARTER': {
      const quarter = Math.floor(executionDate.getMonth() / 3)

      const startFullQuarter = new Date(executionDate.getFullYear(), quarter * 3 - 3, 1)
      const endFullQuarter = new Date(startFullQuarter.getFullYear(), startFullQuarter.getMonth() + 3, 0)

      return {
        minDate: startOfDay(startFullQuarter),
        maxDate: endOfDay(endFullQuarter),
      }
    }
    default:
      throw new Boom.badData(`Invalid reportDateRange type: ${reportDateRange}`)
  }
}

module.exports = {
  getDateRangeFilters,
}
