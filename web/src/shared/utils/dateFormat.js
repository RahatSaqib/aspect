import _ from 'lodash'
import { startOfDay, format as dateFnFormat, parseISO } from 'date-fns'
import { withProps } from 'recompose'
import differenceInDays from 'date-fns/differenceInDays'

import { getAspectDisplayPreferences } from '../../globals/sideEffects/LocalStorage'
import getLocale from './locale'

function format(date, displayPreferenceKey) {
  const prefs = getAspectDisplayPreferences()
  const dateFormat = prefs.get(displayPreferenceKey, 'yyyy-MM-dd')
  return date == null
    ? ''
    : dateFnFormat(parseISO(date.toISOString()), dateFormat)
}

export const SECOND_IN_MILLISECONDS = 1000
export const MINUTE_IN_MILLISECONDS = 60 * SECOND_IN_MILLISECONDS
export const HOUR_IN_MILLISECONDS = 60 * MINUTE_IN_MILLISECONDS
export const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS
export const WEEK_IN_MILLISECONDS = 7 * DAY_IN_MILLISECONDS
export const MONTH_IN_MILLISECONDS = 30 * DAY_IN_MILLISECONDS
export const QUARTER_IN_MILLISECONDS = 3 * MONTH_IN_MILLISECONDS
export const YEAR_IN_MILLISECONDS = 365 * DAY_IN_MILLISECONDS

function formatBase(date, unit) {
  if (_.isString(date)) {
    date = parseISO(date)
  }
  return format(date, unit)
}

export function formatDate(date) {
  return formatBase(date, 'dateFormat')
}

export function formatTime(date) {
  return formatBase(date, 'timeFormat')
}

export function formatDateTime(date) {
  return formatBase(date, 'dateTimeFormat')
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

export const formatRelative = (intl, date) => {
  const dateInMilliseconds = Date.parse(date)
  if (_.isNaN(dateInMilliseconds)) return ''

  const getParams = timeDiffInMilliseconds => {
    const timeInMilliseconds = Math.abs(timeDiffInMilliseconds)
    if (timeInMilliseconds < MINUTE_IN_MILLISECONDS) {
      return { denom: SECOND_IN_MILLISECONDS, unit: 'second' }
    }
    if (timeInMilliseconds < HOUR_IN_MILLISECONDS) {
      return { denom: MINUTE_IN_MILLISECONDS, unit: 'minute' }
    }
    if (timeInMilliseconds < DAY_IN_MILLISECONDS) {
      return { denom: HOUR_IN_MILLISECONDS, unit: 'hour' }
    }
    if (timeInMilliseconds < WEEK_IN_MILLISECONDS) {
      return { denom: DAY_IN_MILLISECONDS, unit: 'day' }
    }
    if (timeInMilliseconds < MONTH_IN_MILLISECONDS) {
      return { denom: WEEK_IN_MILLISECONDS, unit: 'week' }
    }
    if (timeInMilliseconds < QUARTER_IN_MILLISECONDS) {
      return { denom: MONTH_IN_MILLISECONDS, unit: 'month' }
    }
    if (timeInMilliseconds < YEAR_IN_MILLISECONDS) {
      return { denom: QUARTER_IN_MILLISECONDS, unit: 'quarter' }
    }
    return { denom: YEAR_IN_MILLISECONDS, unit: 'year' }
  }

  const timeDiffInMilliseconds = dateInMilliseconds - Date.now()
  const { denom, unit } = getParams(timeDiffInMilliseconds)

  // see details - https://formatjs.io/docs/react-intl/api#formatrelativetime
  return intl.formatRelativeTime(
    Math.round(timeDiffInMilliseconds / denom),
    unit,
    { number: 'auto' }
  )
}

/**
 * @param {string} date The ISO-formatted date that will be compared.
 * @return {number} The number of days between the given date and today.
 */
export const daysUntilToday = date =>
  differenceInDays(new Date(), new Date(date))
