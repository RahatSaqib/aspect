import addMinutes from 'date-fns/addMinutes'
import subMinutes from 'date-fns/subMinutes'

export const negateTimeZoneOffset = dateString => {
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()

  return Math.sign(offset) !== -1 ? addMinutes(date, offset) : subMinutes(date, Math.abs(offset))
}
