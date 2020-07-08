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
import format from 'date-fns/format'

import graphColorMap from '../Variables'
import {
  calcPercentageSplitBar,
  normaliseKeys,
  filterByMultiple,
} from './index'
import { calcPercentageForGraphs } from './calcs'
import { negateTimeZoneOffset } from './datetime'

const groupByKey = (
  data,
  indexBy,
  keyToConsume = false,
  displayMethod = 'actual',
  formatDate = false,
  filterBy
) => {
  const filtered = filterBy ? filterByMultiple(data, filterBy) : data
  const grouped = filtered.reduce((acc, curr) => {
    const countKey = keyToConsume
      ? curr[keyToConsume]
      : filter(graphColorMap, ['id', 99])[0].externalId

    const dateFormatted = formatDate
      ? format(negateTimeZoneOffset(curr[indexBy]), formatDate)
      : curr[indexBy]

    acc[curr[indexBy]] = {
      ...acc[curr[indexBy]],
      [indexBy]: dateFormatted,
      [countKey]: curr.cnt,
    }

    return acc
  }, {})
  return calcPercentageSplitBar(normaliseKeys(grouped), indexBy, displayMethod)
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
  chunk(times(110), 110 / 11).map(r =>
    ranges.push({ rangeId: `${first(r)}-${last(r)}`, values: r })
  )
  const grouped = filtered.reduce((acc, curr) => {
    const { rangeId } =
      ranges.filter(({ values }) => values.includes(Number(curr.age)))[0] ||
      false
    curr = { ...curr, inRange: rangeId }

    const divergentIndex = indexOf(divergences, curr[keyToConsume])
    const currentRange =
      { ...acc[curr[indexBy]] }[curr[keyToConsume]] || curr.cnt
    const sumCount =
      divergentIndex === 1
        ? -Math.abs(curr.cnt) + -Math.abs(currentRange)
        : currentRange + curr.cnt

    acc[curr[indexBy]] = {
      ...acc[curr[indexBy]],
      [indexBy]: curr[indexBy],
      [curr[keyToConsume]]: sumCount,
    }
    return acc
  }, {})
  return sortBy(normaliseKeys(grouped), ['inRange'])
}

const groupForOldTreatmentAPI = (
  data,
  keyToConsume,
  indexBy,
  formatDate,
  filterBy
) => {
  const filtered = filterBy ? filterByMultiple(data, filterBy) : data
  const grouped = filtered.reduce((acc, curr) => {
    const dateFormatted = formatDate
      ? format(negateTimeZoneOffset(curr[indexBy]), formatDate)
      : curr[indexBy]

    acc[curr[indexBy]] = {
      monthTested: dateFormatted,
      Confirmed: Number(curr[keyToConsume]).toFixed(1),
      NotConfirmed:
        curr[keyToConsume] < 1
          ? curr.total
          : Number(100 - curr[keyToConsume]).toFixed(1),
    }
    return acc
  }, {})
  return normaliseKeys(grouped)
}

const groupForPieOldTreatmentAPI = (data, keyToConsume, indexBy, filterBy) => {
  const groupedConfirmed = []
  const groupedNotConfirmed = []
  data.reduce((acc, curr) => {
    if (!acc.id || acc.id !== 'Confirmed') {
      acc = { id: 'Confirmed', label: 'Confirmed', value: curr[keyToConsume] }
      groupedConfirmed.push(acc)
    } else if (acc.id === 'Confirmed') {
      acc.value += curr[keyToConsume]
    }
    return acc
  }, {})

  data.reduce((acc, curr) => {
    if (!acc.id || acc.id !== 'NotConfirmed') {
      acc = {
        id: 'NotConfirmed',
        label: 'NotConfirmed',
        value: curr.total - curr[keyToConsume],
      }
      groupedConfirmed.push(acc)
    } else if (acc.id === 'NotConfirmed') {
      acc.value += curr.total - curr[keyToConsume]
    }
    return acc
  }, {})

  return [...groupedConfirmed, ...groupedNotConfirmed]
}

const groupForDeviceStatusAPI = (
  data,
  keyToConsume,
  indexBy,
  formatDate,
  filterBy,
  displayMethod = 'percentage'
) => {
  const filtered = filterBy ? filterByMultiple(data, filterBy) : data
  const grouped = filtered.reduce((acc, curr) => {
    const {
      isWeekendOrHoliday,
      devicesActive,
      devicesTotal,
      devicesInactive,
    } = curr
    const dateFormatted = formatDate
      ? format(new Date(curr[indexBy]), formatDate)
      : curr[indexBy]

    const shouldBeZero = isWeekendOrHoliday || devicesTotal === 0

    acc[curr[indexBy]] = {
      date: dateFormatted,
      devicesTotal,
      devicesActiveRaw: devicesActive,
      devicesActive: shouldBeZero
        ? 0
        : calcPercentageForGraphs(devicesActive, devicesTotal),
      devicesInactive: shouldBeZero
        ? 0
        : calcPercentageForGraphs(devicesInactive, devicesTotal),
      weekendOrHoliday: isWeekendOrHoliday ? 100 : 0,
    }
    return acc
  }, {})

  return normaliseKeys(grouped)
}

export {
  groupByKey,
  groupForPie,
  groupForDivergent,
  groupForOldTreatmentAPI,
  groupForPieOldTreatmentAPI,
  groupForDeviceStatusAPI,
}
