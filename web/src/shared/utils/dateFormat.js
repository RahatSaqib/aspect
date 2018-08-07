import { format as dateFnFormat } from 'date-fns'
import { getAspectDateFormat } from '../../globals/sideEffects/LocalStorage'

// https://github.com/yahoo/react-intl/wiki/API#formatdate
// formatDate(value, options) => options
export const longNumericFormat = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
}

export const shortNumericDate = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
}

export const shortNumericTime = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
}

export function formatDate(date, { intl } = {}) {
  const dateFormat = getAspectDateFormat()
  if (date == null) {
    return ''
  }

  if (dateFormat != null) {
    return dateFnFormat(date, dateFormat)
  }

  if (intl != null) {
    return intl.formatDate(date, shortNumericDate)
  }

  return dateFnFormat(date, 'YYYY-MM-DD')
}
