const _ = require('lodash')
const { format, parseISO, addMonths } = require('date-fns')
const locales = require('date-fns/locale')

/**
 * Generates an array of month date fields between two dates for report formatting.
 *
 * This function creates a list of month entries that can be used for generating
 * time-based reports, with each entry containing a key for data lookup and a
 * localized header for display purposes.
 *
 * @param {Date|string} minDate - The start date for the month range. Can be a Date object,
 *                                ISO date string, or date string with timezone info.
 *                                For timezone-aware strings, only the date part is used.
 * @param {Date|string} maxDate - The end date for the month range. Can be a Date object,
 *                                ISO date string, or date string with timezone info.
 *                                For timezone-aware strings, only the date part is used.
 * @param {string} culture - The culture/locale string for formatting month names.
 *                          Should be in format like 'en-US', 'fr-FR', etc.
 *                          Only the language part (before the hyphen) is used.
 *
 * @returns {Array<Object>} An array of month objects, each containing:
 *                          - key: {string} The month in 'yyyy-MM' format (e.g., '2024-01')
 *                          - header: {string} The localized month name (e.g., '2024-Jan' for en-US)
 *
 * @example
 * // Basic usage with Date objects
 * const months = getMonthsDatefields(new Date('2024-01-01'), new Date('2024-03-31'), 'en-US');
 * // Returns: [
 * //   { key: '2024-01', header: '2024-Jan' },
 * //   { key: '2024-02', header: '2024-Feb' },
 * //   { key: '2024-03', header: '2024-Mar' }
 * // ]
 *
 * @example
 * // Usage with ISO date strings
 * const months = getMonthsDatefields('2024-01-01', '2024-02-29', 'fr-FR');
 * // Returns: [
 * //   { key: '2024-01', header: '2024-janv.' },
 * //   { key: '2024-02', header: '2024-févr.' }
 * // ]
 *
 * @example
 * // Usage with timezone-aware date strings
 * const months = getMonthsDatefields('2024-01-01T00:00:00Z', '2024-01-31T23:59:59Z', 'es-ES');
 * // Returns: [
 * //   { key: '2024-01', header: '2024-ene' }
 * // ]
 */
function getMonthsDatefields(minDate, maxDate, culture) {
  // Helper function to parse timezone-aware ISO strings correctly
  const parseDateOnly = dateString => {
    if (_.isDate(dateString)) {
      return dateString
    }

    if (typeof dateString === 'string' && dateString.includes('T')) {
      // For timezone-aware dates, just extract the date part and treat it as local
      // This avoids the timezone conversion issue
      const datePart = dateString.split('T')[0]
      return new Date(`${datePart}T00:00:00`)
    }

    return parseISO(dateString)
  }

  const minDateFormatted = parseDateOnly(minDate)
  const maxDateFormatted = parseDateOnly(maxDate)

  const dateFields = []
  const locale = culture.split('-')[0].toLowerCase()

  let curMonth = minDateFormatted
  while (curMonth <= maxDateFormatted) {
    dateFields.push({
      key: format(curMonth, 'yyyy-MM'),
      header: `${format(curMonth, 'yyyy-LLL', {
        locale: locales[locale],
      })}`,
    })
    curMonth = addMonths(curMonth, 1)
  }
  return dateFields
}

module.exports = {
  getMonthsDatefields,
}
