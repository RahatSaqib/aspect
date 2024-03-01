import endOfMonth from 'date-fns/endOfMonth'
import { negateTimeZoneOffset } from './negateTimeZoneOffset'

export const getMinMaxDateFromMonthString = monthYear => {
  const parsedDate = new Date(monthYear)
  const minDate = negateTimeZoneOffset(parsedDate)
  const maxDate = endOfMonth(minDate)
  return { minDate, maxDate }
}
