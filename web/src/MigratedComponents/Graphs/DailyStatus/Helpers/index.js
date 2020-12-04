// eslint-disable-next-line lodash/import-scope
import _ from 'lodash'
import {
  isWeekend,
  addDays,
  format,
  startOfWeek,
  getDaysInMonth,
  getWeeksInMonth,
  getWeek,
  isValid,
} from 'date-fns'

function groupDateRanges(data) {
  const output = []
  const dateFormat = 'd/M'
  _.map(data, (v, k) => {
    const min = format(_.first(v), dateFormat)
    const max = v.length > 1 ? format(_.last(v), dateFormat) : false
    return output.push({ week: k, min, max, size: v.length })
  })
  return output
}

function dateRangeByWeekDay(startOfMonth) {
  const amountOfDays = _.range(0, getDaysInMonth(startOfMonth))
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

export { groupDateRanges, dateRangeByWeekDay }
