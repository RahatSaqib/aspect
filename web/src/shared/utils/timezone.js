import _ from 'lodash'
import { timezones } from '../../filter/hardcoded'

export { timezones }

export const getTimezoneById = timeZoneId => {
  const timezone = _.find(timezones, { id: timeZoneId })
  if (timezone) {
    return timezone.timeZone
  } else if (Intl) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  return ''
}
