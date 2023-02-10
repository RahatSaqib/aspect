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
import graphColorMap from '../Variables'
import {
  calcPercentageSplitBar,
  normaliseKeys,
  filterByMultiple,
  calcPercentageForGraphs,
  dateRangeOptions,
  negateTimeZoneOffset,
} from './index'

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

const groupForPieRow = (data, mergedParams) => {
  const keysToRenderOrder = [
    'assayName',
    'cntAll',
    'cntPositive',
    'percentPositive',
    'percentReported',
    'percentViaSms',
    'percentViaEmail',
    'percentWithin2Hours',
  ]

  const pieValueFormat = key => {
    let type
    switch (true) {
      case key.includes('percent'):
        type = 'percent'
        break
      case key.includes('cnt'):
        type = 'int'
        break

      default:
        type = 'string'
        break
    }
    return type
  }

  const pieWidgetType = (_key, value, difference) => {
    let type
    switch (true) {
      case typeof value === 'number' && difference !== undefined:
        type = 'doughnut'
        break

      case typeof value === 'string':
        type = 'string'
        break

      default:
        type = 'solid'
        break
    }
    return type
  }

  const buildLink = (id, assayId, resultCategoryPositiveId, mergedParams) => {
    let link
    const getDateRanges = dateRangeOptions()
    const dateRanges = getDateRanges[Object.keys(getDateRanges)]
    const dateMonthStart = mergedParams && mergedParams.length ? mergedParams[0].currentMonth : false
    const dateMonthEnd =
      dateRanges && dateRanges.length
        ? filter(dateRanges, {
            value: { minDate: dateMonthStart },
          })[0].value.maxDate
        : false

    const linkBase = '/browse/result?filters='
    const assayUrl = `assayId%3D${assayId}`
    const minDateUrl = `minDate%3D${dateMonthStart}`
    const maxDateUrl = `maxDate%3D${dateMonthEnd}`
    const resultCategoryUrl = `resultCategoryId%3D${resultCategoryPositiveId}`

    switch (true) {
      case id === 'cntAll':
        link = `${linkBase}${assayUrl}%26${minDateUrl}%26${maxDateUrl}`
        break

      case id === 'cntPositive':
        link = `${linkBase}${assayUrl}%26${minDateUrl}%26${maxDateUrl}%26${resultCategoryUrl}`
        break

      default:
        link = false
        break
    }

    return link
  }

  const valueSplit = (key, value, type, difference) => {
    const diffs = difference !== undefined ? { difference } : {}
    switch (true) {
      case type === 'doughnut':
        return [
          {
            id: key,
            label: key,
            value,
            ...diffs,
          },
          {
            id: 'noData',
            label: 'noData',
            value: 100 - value,
            ...diffs,
          },
        ]

      case type === 'string':
        return [
          {
            id: key,
            label: key,
            value: value.replace(/(^|\s)GeneXpert(\s|$)/gm, ''),
          },
        ]

      default:
        return [
          {
            id: key,
            label: key,
            value: value > 0 ? value : 100,
            valueLabel: value,
            ...diffs,
          },
        ]
    }
  }

  const pieRows = []

  data.map(({ assayId, resultCategoryPositiveId, ...rest }) => {
    const pieRow = {}
    for (const [key, value] of Object.entries(rest)) {
      if (keysToRenderOrder.includes(key)) {
        const hasChange = rest[`${key}Change`]
        const type = pieWidgetType(key, value, hasChange)
        const format = pieValueFormat(key)
        const link = buildLink(key, assayId, resultCategoryPositiveId, mergedParams)
        pieRow[key] = {
          heading: `${key}`,
          type,
          format,
          link,
          value: valueSplit(key, value, type, hasChange),
        }
      }
    }
    return pieRows.push(
      Object.keys(pieRow).reduce((r, k) => {
        return r.concat(pieRow[k])
      }, [])
    )
  })
  return pieRows
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

const groupForPieOldTreatmentAPI = (data, keyToConsume) => {
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

const groupForInventoryStatusAPI = (data, i18nKeys, formatMessage, messages) => {
  const grouped = []
  map(data, ({ consumableId, consumableName, ...rest }) =>
    map(rest, (val, key) => {
      const findRenamedKey = formatMessage(messages[i18nKeys[key]])
      const renamedKey = findRenamedKey || key
      return grouped.push({
        consumableId,
        consumableName,
        increment: renamedKey,
        [key]: val,
        count: val,
      })
    })
  )
  return grouped
}

export {
  groupByKey,
  groupForPie,
  groupForPieRow,
  groupForDivergent,
  groupForInventoryStatusAPI,
  groupForOldTreatmentAPI,
  groupForPieOldTreatmentAPI,
  groupForDeviceStatusAPI,
}
