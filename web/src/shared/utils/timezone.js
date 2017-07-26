import _ from 'lodash'
import * as localStorage from './localStorage'
import { timezones } from '../../filter/hardcoded'

export const getTimezoneById = timeZoneId => {
  const timezone = _.find(timezones, { id: timeZoneId })
  if (timezone) {
    return timezone.timeZone
  } else if (Intl) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  return ''
}

export const getUsersTimezone = timezone =>
  getTimezoneById(timezone || localStorage.getTimezone())
