import { format as dateFnFormat } from 'date-fns'
import { getAspectDisplayPreferences } from '../../globals/sideEffects/LocalStorage'

function format(date, displayPreferenceKey) {
  const prefs = getAspectDisplayPreferences()
  const dateFormat = prefs.get(displayPreferenceKey, 'YYYY-MM-DD')
  return date == null ? '' : dateFnFormat(date, dateFormat)
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
