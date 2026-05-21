import endOfDay from 'date-fns/endOfDay'
import endOfMonth from 'date-fns/endOfMonth'
import endOfQuarter from 'date-fns/endOfQuarter'
import endOfWeek from 'date-fns/endOfWeek'
import endOfYear from 'date-fns/endOfYear'
import format from 'date-fns/format'
import getQuarter from 'date-fns/getQuarter'
import startOfDay from 'date-fns/startOfDay'
import startOfMonth from 'date-fns/startOfMonth'
import startOfQuarter from 'date-fns/startOfQuarter'
import startOfWeek from 'date-fns/startOfWeek'
import startOfYear from 'date-fns/startOfYear'
import subtractDays from 'date-fns/subDays'
import subtractMonths from 'date-fns/subMonths'
import subtractQuarters from 'date-fns/subQuarters'
import subtractWeeks from 'date-fns/subWeeks'
import subtractYears from 'date-fns/subYears'
import messages from '../../messages/allMessages'
import { getAspectDisplayPreferences } from '../LocalStorage'

const { dayMonthFormat } = getAspectDisplayPreferences().toJS()

// fixed values
const today = new Date()
const yesterday = subtractDays(today, 1)
const last7DaysStart = subtractDays(today, 7)
const thisWeekStart = startOfWeek(today)
const thisWeekEnd = endOfWeek(today)
const lastWeek = subtractWeeks(today, 1)
const lastWeekStart = startOfWeek(lastWeek)
const lastWeekEnd = endOfWeek(lastWeek)
const last30DaysStart = subtractDays(today, 30)
const thisMonthStart = startOfMonth(today)
const thisMonthEnd = endOfMonth(today)
const lastMonth = subtractMonths(today, 1)
const lastMonthStart = startOfMonth(lastMonth)
const lastMonthEnd = endOfMonth(lastMonth)
const thisQuarterStart = startOfQuarter(today)
const thisQuarterEnd = endOfQuarter(today)
const thisYearStart = startOfYear(today)
const thisYearEnd = endOfYear(today)
const lastYear = subtractYears(today, 1)
const lastYearStart = startOfYear(lastYear)
const lastYearEnd = endOfYear(lastYear)

// days
const daysOptions = formatDate => {
  const daysBeforeYesterday = []
  for (let i = 2; i < 8; i++) {
    const day = subtractDays(today, i)
    daysBeforeYesterday.push({
      id: 21 + i,
      label: formatDate(day, { weekday: 'long', day: '2-digit', month: '2-digit' }),
      value: { minDate: startOfDay(day), maxDate: endOfDay(day) },
    })
  }
  return daysBeforeYesterday
}

// weeks
const weeksOptions = () => {
  const weeksBeforeLast = []
  for (let i = 2; i < 8; i++) {
    const week = subtractWeeks(today, i)
    const weekStart = startOfWeek(week)
    const weekEnd = endOfWeek(week)
    weeksBeforeLast.push({
      id: 32 + i,
      label: `${format(weekStart, dayMonthFormat)} - ${format(weekEnd, dayMonthFormat)}`,
      value: { minDate: weekStart, maxDate: weekEnd },
    })
  }
  return weeksBeforeLast
}

// months
const monthsOptions = formatDate => {
  const monthsBeforeLast = []
  for (let i = 2; i < 12; i++) {
    const dayInMonth = subtractMonths(today, i)
    const monthStart = startOfMonth(dayInMonth)
    const monthEnd = endOfMonth(dayInMonth)
    monthsBeforeLast.push({
      id: 42 + i,
      label: formatDate(monthStart, { month: 'long', year: 'numeric' }),
      value: { minDate: startOfDay(monthStart), maxDate: endOfDay(monthEnd) },
    })
  }
  return monthsBeforeLast
}

// quarter
const quartersOptions = intl => {
  const previousQuarters = []
  for (let i = 1; i < 12; i++) {
    const dayInQuarter = subtractQuarters(today, i)
    const quarterStart = startOfQuarter(dayInQuarter)
    const quarterEnd = endOfQuarter(dayInQuarter)
    previousQuarters.push({
      id: 51 + i,
      label: `${intl.formatMessage(messages.quarter)} ${getQuarter(dayInQuarter)} ${intl.formatDate(dayInQuarter, {
        year: 'numeric',
      })}`,
      value: { minDate: startOfDay(quarterStart), maxDate: endOfDay(quarterEnd) },
    })
  }
  return previousQuarters
}

// years
const yearsOptions = formatDate => {
  const yearsBeforeLast = []
  for (let i = 2; i < 7; i++) {
    const dayInYear = subtractYears(today, i)
    const yearStart = startOfYear(dayInYear)
    const yearEnd = endOfYear(dayInYear)
    yearsBeforeLast.push({
      id: 61 + i,
      label: formatDate(yearStart, { year: 'numeric' }),
      value: { minDate: yearStart, maxDate: yearEnd },
    })
  }
  return yearsBeforeLast
}

const customYearsOptions = (formatDate, year) => {
  const yearsBeforeLast = []
  for (let i = 0; i < 7; i++) {
    const dayInYear = subtractYears(year, i)
    const yearStart = startOfYear(dayInYear)
    const yearEnd = endOfYear(dayInYear)
    yearsBeforeLast.push({
      id: 61 + i,
      label: formatDate(yearStart, { year: 'numeric' }),
      value: { minDate: yearStart, maxDate: yearEnd },
    })
  }
  return yearsBeforeLast
}

export const dayOptions = intl => [
  {
    id: 21,
    label: `${intl.formatMessage(messages.today)} (${intl.format(today, dayMonthFormat)})`,
    value: { minDate: startOfDay(today), maxDate: endOfDay(today) },
  },
  {
    id: 22,
    label: `${intl.formatMessage(messages.yesterday)} (${intl.format(yesterday, dayMonthFormat)})`,
    value: { minDate: startOfDay(yesterday), maxDate: endOfDay(yesterday) },
  },
  ...daysOptions(intl.formatDate),
]

export const weekOptions = intl => [
  {
    id: 31,
    label: `${intl.formatMessage(messages.last7Days)}`,
    value: { minDate: startOfDay(last7DaysStart), maxDate: endOfDay(today) },
  },
  {
    id: 32,
    label: `${intl.formatMessage(messages.thisWeek)} (${format(thisWeekStart, dayMonthFormat)} - ${format(
      thisWeekEnd,
      dayMonthFormat
    )})`,
    value: { minDate: thisWeekStart, maxDate: thisWeekEnd },
  },
  {
    id: 33,
    label: `${intl.formatMessage(messages.lastWeek)} (${format(lastWeekStart, dayMonthFormat)} - ${format(
      lastWeekEnd,
      dayMonthFormat
    )})`,
    value: { minDate: lastWeekStart, maxDate: lastWeekEnd },
  },
  ...weeksOptions(),
]

export const monthOptions = intl => [
  {
    id: 41,
    label: `${intl.formatMessage(messages.last30Days)}`,
    value: { minDate: startOfDay(last30DaysStart), maxDate: endOfDay(today) },
  },
  {
    id: 42,
    label: `${intl.formatMessage(messages.thisMonth)} (${format(thisMonthStart, dayMonthFormat)} - ${format(
      thisMonthEnd,
      dayMonthFormat
    )})`,
    value: { minDate: thisMonthStart, maxDate: thisMonthEnd },
  },
  {
    id: 43,
    label: `${intl.formatMessage(messages.lastMonth)} (${format(lastMonthStart, dayMonthFormat)} - ${format(
      lastMonthEnd,
      dayMonthFormat
    )})`,
    value: { minDate: lastMonthStart, maxDate: lastMonthEnd },
  },
  ...monthsOptions(intl.formatDate),
]

export const quarterOptions = intl => [
  {
    id: 51,
    label: `${intl.formatMessage(messages.thisQuarter)}`,
    value: { minDate: startOfDay(thisQuarterStart), maxDate: endOfDay(thisQuarterEnd) },
  },
  ...quartersOptions(intl),
]

export const yearOptions = intl => [
  {
    id: 61,
    label: `${intl.formatMessage(messages.thisYear)} (${intl.formatDate(thisYearStart, { year: 'numeric' })})`,
    value: { minDate: thisYearStart, maxDate: thisYearEnd },
  },
  {
    id: 62,
    label: `${intl.formatMessage(messages.lastYear)} (${intl.formatDate(lastYearStart, { year: 'numeric' })})`,
    value: { minDate: lastYearStart, maxDate: lastYearEnd },
  },
  ...yearsOptions(intl.formatDate),
]

export const customYearOptions = (intl, year) => [...customYearsOptions(intl.formatDate, year)]
