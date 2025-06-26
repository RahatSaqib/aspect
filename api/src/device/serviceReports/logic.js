const _ = require('lodash')
const { format, parseISO, addMonths } = require('date-fns')
const locales = require('date-fns/locale')

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
