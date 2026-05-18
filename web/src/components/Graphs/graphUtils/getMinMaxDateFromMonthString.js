import endOfMonth from 'date-fns/endOfMonth'
import { negateTimeZoneOffset } from './negateTimeZoneOffset'

/**
 * This function is used to link monthly graphs to the results list by generating the min date and max date to set in the filters based on the selected month and year.
 * @param {*} monthYear The month and year in the format YYYY-MM
 * @returns And object containing the minDate and maxDate objects
 */
export const getMinMaxDateFromMonthString = monthYear => {
  const parsedDate = new Date(monthYear)
  const minDate = negateTimeZoneOffset(parsedDate)
  const maxDate = endOfMonth(minDate)
  return { minDate, maxDate }
}
