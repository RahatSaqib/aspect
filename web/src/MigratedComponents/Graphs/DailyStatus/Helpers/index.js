import map from 'lodash/map'
import first from 'lodash/first'
import last from 'lodash/last'
import range from 'lodash/range'
import findIndex from 'lodash/findIndex'
import isWeekend from 'date-fns/isWeekend'
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'
import getDaysInMonth from 'date-fns/getDaysInMonth'
import getWeek from 'date-fns/getWeek'

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

function dateRangeByWeekDay(startOfMonth) {
  const amountOfDays = range(0, getDaysInMonth(startOfMonth))
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

export { getIndex, groupDateRanges, dateRangeByWeekDay }
