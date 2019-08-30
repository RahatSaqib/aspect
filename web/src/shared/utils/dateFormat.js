import { startOfDay, format as dateFnFormat, parseISO } from 'date-fns'
import { withProps } from 'recompose'

import { getAspectDisplayPreferences } from '../../globals/sideEffects/LocalStorage'
import getLocale from './locale'

function format(date, displayPreferenceKey) {
  const prefs = getAspectDisplayPreferences()
  const dateFormat = prefs.get(displayPreferenceKey, 'yyyy-MM-dd')
  return date == null
    ? ''
    : dateFnFormat(parseISO(date.toISOString()), dateFormat)
}

export function formatDate(date) {
  return format(parseISO(date), 'dateFormat')
}

export function formatTime(date) {
  return format(parseISO(date), 'timeFormat')
}

export function formatDateTime(date) {
  return format(parseISO(date), 'dateTimeFormat')
}

export const formatWithLocale = locale => (date, formatStr) =>
  dateFnFormat(date, formatStr, { locale: getLocale(locale) })

export const withDateFormatProps = withProps(() => {
  const prefs = getAspectDisplayPreferences()
  return {
    dateFormat: prefs.get('dateFormat'),
  }
})

export const withTimeFormatProps = withProps(() => {
  const prefs = getAspectDisplayPreferences()
  return {
    timeFormat: prefs.get('timeFormat'),
  }
})

export const withDateTimeFormatProps = withProps(() => {
  const prefs = getAspectDisplayPreferences()
  return {
    dateTimeFormat: prefs.get('dateTimeFormat'),
  }
})

export const withTodayProps = withProps(() => ({
  today: startOfDay(new Date()),
}))
