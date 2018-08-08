import { format as dateFnFormat } from 'date-fns'
import { getAspectDateFormat } from '../../globals/sideEffects/LocalStorage'

const defaultDateFormat = 'M/D/YYYY' // YYYY-MM-DD
const defaultTimeFormat = 'h:mm:ss A' // HH:mm:ss
const defaultDateTimeFormat = `${defaultDateFormat}, ${defaultTimeFormat}`

function format(date, dateFormat) {
  return date == null ? '' : dateFnFormat(date, dateFormat)
}

export function formatDate(date) {
  return format(date, getAspectDateFormat() || defaultDateFormat)
}

export function formatTime(date) {
  return format(date, defaultTimeFormat)
}

export function formatDateTime(date) {
  return format(date, defaultDateTimeFormat)
}
