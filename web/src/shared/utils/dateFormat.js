import _ from 'lodash'
import { format as dateFnFormat } from 'date-fns'
import { getAspectDisplayPreferences } from '../../globals/sideEffects/LocalStorage'

function format(date, displayPreferenceKey) {
  const prefs = getAspectDisplayPreferences()
  const dateFormat = _.replace(
    prefs.get(displayPreferenceKey, 'YYYY-MM-dd'),
    /D/g,
    'd'
  )

  return date == null
    ? ''
    : dateFnFormat(date, dateFormat, { awareOfUnicodeTokens: true })
}

export function formatDate(date) {
  return format(date, 'dateFormat')
}

export function formatTime(date) {
  return format(date, 'timeFormat')
}

export function formatDateTime(date) {
  return format(date, 'dateTimeFormat')
}
