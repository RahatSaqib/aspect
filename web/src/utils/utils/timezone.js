import find from 'lodash/find'
import { timezones } from '../../oldComponents/filter/hardcoded'

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
