import isString from 'lodash/isString'
import find from 'lodash/find'
import parseISO from 'date-fns/parseISO'
import { convertToTimeZone } from 'date-fns-timezone'
import { timezones } from '../../filter/hardcoded'

export { timezones }

export const getTimezoneById = timeZoneId => {
  const timezone = find(timezones, { id: timeZoneId })
  if (timezone) {
    return timezone.timeZone
  }
  if (Intl) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  return ''
}

export function getUtcInLocalTime(datetime, timezoneId) {
  if (!datetime) return

  if (isString(datetime)) {
    datetime = parseISO(datetime)
  }

  return convertToTimeZone(datetime, { timeZone: getTimezoneById(timezoneId) })
}
