import format from 'date-fns/format'
import chunk from 'lodash/chunk'
import filter from 'lodash/filter'
import first from 'lodash/first'
import groupBy from 'lodash/groupBy'
import indexOf from 'lodash/indexOf'
import last from 'lodash/last'
import map from 'lodash/map'
import sortBy from 'lodash/sortBy'
import sumBy from 'lodash/sumBy'
import times from 'lodash/times'
import uniqBy from 'lodash/uniqBy'
import {
  calcPercentageSplitBar,
  normaliseKeys,
  filterByMultiple,
  calcPercentageForGraphs,
  negateTimeZoneOffset,
} from '.'
import graphColorMap from '../Variables/Variables'

const groupByKey = (data, indexBy, keyToConsume = false, displayMethod = 'actual', formatDate = false, filterBy) => {
  const filtered = filterBy ? filterByMultiple(data, filterBy) : data
  const grouped = filtered.reduce((acc, curr) => {
    const countKey = keyToConsume ? curr[keyToConsume] : filter(graphColorMap, ['id', 999])[0].externalId

    const dateFormatted =
      formatDate && formatDate !== 'MMM' ? format(negateTimeZoneOffset(curr[indexBy]), formatDate) : curr[indexBy]

    acc[curr[indexBy]] = {
      ...acc[curr[indexBy]],
      [indexBy]: dateFormatted,
      [countKey]: curr.cnt,
    }
    return acc
  }, {})

  return calcPercentageSplitBar(normaliseKeys(grouped), indexBy, displayMethod, 12)
}

const groupForPie = (data, keyToConsume, indexBy, filterBy) => {
  const grouped = []
  const filtered = filterBy ? filterByMultiple(data, filterBy) : data

  map(groupBy(filtered, keyToConsume), group =>
    grouped.push({
      id: group[0][keyToConsume],
      label: group[0][keyToConsume],
      value: sumBy(group, indexBy),
    })
  )

  return grouped
}

const groupForDivergent = (data, indexBy, keyToConsume, filterBy) => {
  const divergences = []
  const ranges = []
  uniqBy(data, keyToConsume).map(d => divergences.push(d[keyToConsume]))

  const filtered = filterBy ? filterByMultiple(data, filterBy) : data
  chunk(times(110), 110 / 11).map(r => ranges.push({ rangeId: `${first(r)}-${last(r)}`, values: r }))
  const grouped = filtered.reduce((acc, curr) => {
    const { rangeId } = ranges.filter(({ values }) => values.includes(Number(curr.age)))[0] || false
    curr = { ...curr, inRange: rangeId }

    const divergentIndex = indexOf(divergences, curr[keyToConsume])
    const currentRange = { ...acc[curr[indexBy]] }[curr[keyToConsume]] || curr.cnt
    const sumCount = divergentIndex === 1 ? -Math.abs(curr.cnt) + -Math.abs(currentRange) : currentRange + curr.cnt

    acc[curr[indexBy]] = {
      ...acc[curr[indexBy]],
      [indexBy]: curr[indexBy],
      [curr[keyToConsume]]: sumCount,
    }
    return acc
  }, {})
  return sortBy(normaliseKeys(grouped), ['inRange'])
}

const groupForOldTreatmentAPI = (data, keyToConsume, indexBy, formatDate, filterBy, displayMethod) => {
  const filtered = filterBy ? filterByMultiple(data, filterBy) : data
  const grouped = filtered.reduce((acc, curr) => {
    const dateFormatted =
      formatDate && formatDate !== 'MMM' ? format(negateTimeZoneOffset(curr[indexBy]), formatDate) : curr[indexBy]

    acc[curr[indexBy]] = {
      monthTested: dateFormatted,
      Confirmed: displayMethod === 'percentage' ? +Number(curr[keyToConsume]).toFixed(1) : curr[keyToConsume],
      NotConfirmed:
        curr[keyToConsume] < 1
          ? displayMethod === 'percentage'
            ? 100
            : curr.total
          : +Number(100 - curr[keyToConsume]).toFixed(1),
      totalCnt: curr.total,
    }
    return acc
  }, {})
  return normaliseKeys(grouped)
}

const weekendOrHolidayInactive = (inactive = 0, total, isWeekendOrHoliday) =>
  isWeekendOrHoliday ? 0 : +calcPercentageForGraphs(inactive, total)

const groupForDeviceStatusAPI = (data, keyToConsume, indexBy, formatDate, filterBy) => {
  const filtered = filterBy ? filterByMultiple(data, filterBy) : data
  const grouped = filtered.reduce((acc, curr) => {
    const { isWeekendOrHoliday, devicesActive, devicesTotal, devicesInactive } = curr

    const dateFormatted = formatDate ? format(negateTimeZoneOffset(curr[indexBy]), formatDate) : curr[indexBy]

    const shouldBeZero = devicesTotal === 0

    acc[curr[indexBy]] = {
      date: dateFormatted,
      devicesTotal,
      devicesActiveRaw: devicesActive,
      devicesActive: +calcPercentageForGraphs(devicesActive, devicesTotal),
      weekendOrHoliday: isWeekendOrHoliday
        ? shouldBeZero
          ? 0
          : +calcPercentageForGraphs(devicesInactive, devicesTotal)
        : 0,
      inactiveUnknown: weekendOrHolidayInactive(curr.inactiveUnknown, devicesTotal, isWeekendOrHoliday),
      inactiveDownForRepair: weekendOrHolidayInactive(curr.inactiveDownForRepair, devicesTotal, isWeekendOrHoliday),
      inactiveNoTestsPerformed: weekendOrHolidayInactive(
        curr.inactiveNoTestsPerformed,
        devicesTotal,
        isWeekendOrHoliday
      ),
      inactiveOutOfInventory: weekendOrHolidayInactive(curr.inactiveOutOfInventory, devicesTotal, isWeekendOrHoliday),
      inactiveNoStaff: weekendOrHolidayInactive(curr.inactiveNoStaff, devicesTotal, isWeekendOrHoliday),
      inactiveNoSamples: weekendOrHolidayInactive(curr.inactiveNoSamples, devicesTotal, isWeekendOrHoliday),
      inactiveNoPower: weekendOrHolidayInactive(curr.inactiveNoPower, devicesTotal, isWeekendOrHoliday),
      inactiveOther: weekendOrHolidayInactive(curr.inactiveOther, devicesTotal, isWeekendOrHoliday),
    }
    return acc
  }, {})
  return normaliseKeys(grouped)
}

export { groupByKey, groupForPie, groupForDivergent, groupForOldTreatmentAPI, groupForDeviceStatusAPI }
