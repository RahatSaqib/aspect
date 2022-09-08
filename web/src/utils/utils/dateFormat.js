import format from 'date-fns/format'
import startOfDay from 'date-fns/startOfDay'
import isDate from 'lodash/isDate'
import isEmpty from 'lodash/isEmpty'
import isNaN from 'lodash/isNaN'
import isNil from 'lodash/isNil'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import { withProps } from 'recompose'
import { i18nWrapper } from '../../providers/I18nProvider'
import { getAspectDisplayPreferences, getTimezoneId } from '../LocalStorage'
import getLocale from './locale'
import { getTimezoneById } from './timezone'

export function getDateObject(date, defaultValue) {
  let formatedDate = defaultValue || null
  try {
    if (!isEmpty(date) && (isString(date) || isNumber(date))) {
      formatedDate = new Date(date)
    }
    if (isDate(date)) {
      formatedDate = date
    }
  } catch (e) {
    return null
  }
  return formatedDate
}

function formatBase(date, displayPreferenceKey) {
  const prefs = getAspectDisplayPreferences()
  const userSetTimeZone = getTimezoneId()
  const { code: localeCode } = getLocale()
  const timeZone = getTimezoneById(userSetTimeZone)
  const dateFormatPreference = prefs.get(displayPreferenceKey, 'yyyy-MM-dd')
  const timeToFormat = isString(date) ? new Date(date).toLocaleString(localeCode, { timeZone }) : date

  return timeToFormat === null ? '' : format(new Date(timeToFormat), dateFormatPreference)
}

export const SECOND_IN_MILLISECONDS = 1000
export const MINUTE_IN_MILLISECONDS = 60 * SECOND_IN_MILLISECONDS
export const HOUR_IN_MILLISECONDS = 60 * MINUTE_IN_MILLISECONDS
export const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS
export const WEEK_IN_MILLISECONDS = 7 * DAY_IN_MILLISECONDS
export const MONTH_IN_MILLISECONDS = 30 * DAY_IN_MILLISECONDS
export const QUARTER_IN_MILLISECONDS = 3 * MONTH_IN_MILLISECONDS
export const YEAR_IN_MILLISECONDS = 365 * DAY_IN_MILLISECONDS

export function formatDate(date) {
  return formatBase(date, 'dateFormat')
}

export function formatTime(date) {
  return formatBase(date, 'timeFormat')
}

export function formatDateTime(date) {
  return formatBase(date, 'dateTimeFormat')
}

export const formatWithLocale = locale => (date, formatStr) => format(date, formatStr, { locale: getLocale(locale) })

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

export const formatRelative = (date, defaultMessage = '') => {
  const dateInMilliseconds = new Date(date).getTime()
  if (isNil(date) || isNaN(dateInMilliseconds)) return defaultMessage

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
  const { formatRelativeTime } = i18nWrapper()

  // see details - https://formatjs.io/docs/react-intl/api#formatrelativetime
  return formatRelativeTime(Math.round(timeDiffInMilliseconds / denom), unit, {
    number: 'auto',
  })
}
