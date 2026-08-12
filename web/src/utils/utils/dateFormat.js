import format from 'date-fns/format'
import isDate from 'lodash/isDate'
import isEmpty from 'lodash/isEmpty'
import isNaN from 'lodash/isNaN'
import isNil from 'lodash/isNil'
import isNumber from 'lodash/isNumber'
import isString from 'lodash/isString'
import { getAspectDisplayPreferences } from '../../components/LocalStorage'
import getLocale from './locale'

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

const SECOND_IN_MILLISECONDS = 1000
const MINUTE_IN_MILLISECONDS = 60 * SECOND_IN_MILLISECONDS
const HOUR_IN_MILLISECONDS = 60 * MINUTE_IN_MILLISECONDS
const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS
const WEEK_IN_MILLISECONDS = 7 * DAY_IN_MILLISECONDS
const MONTH_IN_MILLISECONDS = 30 * DAY_IN_MILLISECONDS
const QUARTER_IN_MILLISECONDS = 3 * MONTH_IN_MILLISECONDS
const YEAR_IN_MILLISECONDS = 365 * DAY_IN_MILLISECONDS

// Format the date without changing the time. Handling the timezone is the API's (backend) responsibility, not the frontend's
function formatBase(date, displayPreferenceKey, defaultFormat) {
  if (!date) return ''
  const prefs = getAspectDisplayPreferences()
  const dateFormatPreference = prefs[displayPreferenceKey] || defaultFormat
  return format(new Date(date.replace('Z', '')), dateFormatPreference)
}

export function formatDate(date) {
  return formatBase(date, 'dateFormat', 'yyyy-MM-dd')
}

export function formatDateTime(date) {
  return formatBase(date, 'dateTimeFormat', 'yyyy-MM-dd HH:mm')
}

export const formatWithLocale = locale => (date, formatStr) => format(date, formatStr, { locale: getLocale(locale) })

export const formatRelative = (date, formatRelativeTime, defaultMessage = '') => {
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

  // see details - https://formatjs.io/docs/react-intl/api#formatrelativetime
  return formatRelativeTime(Math.round(timeDiffInMilliseconds / denom), unit, {
    number: 'auto',
  })
}
