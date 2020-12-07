import map from 'lodash/map'
import first from 'lodash/first'
import last from 'lodash/last'
import range from 'lodash/range'
import findIndex from 'lodash/findIndex'
import isWeekend from 'date-fns/isWeekend'
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'
import getWeek from 'date-fns/getWeek'
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'

function groupDateRanges(data) {
  const output = []
  const dateFormat = 'd/M'
  map(data, (v, k) => {
    const min = format(first(v), dateFormat)
    const max = v.length > 1 ? format(last(v), dateFormat) : false
    return output.push({ week: k, min, max, size: v.length })
  })
  return output
}

function dateRangeByWeekDay(startOfMonth, endOfPeriodDate) {
  const amountOfDays = range(
    0,
    differenceInCalendarDays(endOfPeriodDate, startOfMonth) + 1
  )
  return amountOfDays.reduce((acc, curr) => {
    const thisDay = addDays(startOfMonth, curr)
    const weekInt = getWeek(thisDay, { weekStartsOn: 1 })
    const weekIndicator = isWeekend(thisDay) ? `${weekInt}_we` : `${weekInt}_wd`
    if (!acc[weekIndicator]) {
      acc[weekIndicator] = []
    }
    acc[weekIndicator].push(thisDay)
    return acc
  }, {})
}

function getIndex(obj, key, val) {
  return findIndex(obj, { [key]: val })
}

function getTotalDays({ minDate, maxDate }) {
  return differenceInCalendarDays(new Date(maxDate), new Date(minDate)) + 1
}

export { getIndex, getTotalDays, groupDateRanges, dateRangeByWeekDay }
