import addDays from 'date-fns/addDays'
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'
import getWeek from 'date-fns/getWeek'
import isWeekend from 'date-fns/isWeekend'
import findIndex from 'lodash/findIndex'
import first from 'lodash/first'
import isUndefined from 'lodash/isUndefined'
import last from 'lodash/last'
import map from 'lodash/map'
import mapValues from 'lodash/mapValues'
import range from 'lodash/range'
import { months } from '../../../../messages'
import { i18nWrapper } from '../../../../providers/I18nProvider'

const { formatMessage } = i18nWrapper()

const formatDate = (month, day) => `${formatMessage(months[month])} - ${day}`

function groupDateRanges(data) {
  const output = []
  map(data, (daysOfWeek, week) => {
    const firstDayOfPeriod = first(daysOfWeek)
    const lastDayOfPeriod = last(daysOfWeek)
    const min = formatDate(firstDayOfPeriod.getMonth(), firstDayOfPeriod.getDate())
    let max = daysOfWeek.length > 1 ? formatDate(lastDayOfPeriod.getMonth(), lastDayOfPeriod.getDate()) : false
    if (max && firstDayOfPeriod.getMonth() === lastDayOfPeriod.getMonth()) {
      max = lastDayOfPeriod.getDate()
    }
    return output.push({ week, min, max, size: daysOfWeek.length })
  })
  return output
}

function dateRangeByWeekDay(startOfMonth, endOfPeriodDate) {
  const amountOfDays = range(0, differenceInCalendarDays(endOfPeriodDate, startOfMonth) + 1)
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

const getDayTitle = ({
  checked,
  daysInSameStatus,
  formatMessage,
  isActive,
  maintenanceStatusName,
  totalResults,
  messages,
  maintenanceStatusI18nKey,
}) => {
  if (checked && daysInSameStatus) {
    return maintenanceStatusName
      ? formatMessage(messages.toolTipTitleWithStatus, {
          maintenanceStatusName,
          daysInSameStatus,
          totalResults,
        })
      : formatMessage(messages.toolTipTitleWithoutStatus, {
          daysInSameStatus,
        })
  }
  return isActive
    ? formatMessage(messages.toolTipTitleResultsReported, {
        maintenanceStatusName,
        totalResults,
      })
    : messages[maintenanceStatusI18nKey]
    ? formatMessage(messages[maintenanceStatusI18nKey])
    : maintenanceStatusName
}

const setClassNames = (item, cssClasses) => {
  if (item.classNames) {
    item.classNames = mapValues(item.classNames, className => cssClasses(className))
  }
}

const setInitialValue = (items, id, initialValue, cssClasses, callback) => {
  const item = items.find(x => x.id === id)
  if (item) {
    if (!isUndefined(initialValue)) {
      item.initialValue = initialValue
    }

    setClassNames(item, cssClasses)

    if (callback) {
      callback(item)
    }
  }
  return item
}

export { dateRangeByWeekDay, getDayTitle, getIndex, getTotalDays, groupDateRanges, setClassNames, setInitialValue }
