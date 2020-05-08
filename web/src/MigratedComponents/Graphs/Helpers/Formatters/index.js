import Ajv from 'ajv'

import _ from 'lodash'
import chunk from 'lodash/chunk'
import filter from 'lodash/filter'
import first from 'lodash/first'
import forOwn from 'lodash/forOwn'
import groupBy from 'lodash/groupBy'
import includes from 'lodash/includes'
import indexOf from 'lodash/indexOf'
import omit from 'lodash/omit'
import keys from 'lodash/keys'
import last from 'lodash/last'
import map from 'lodash/map'
import max from 'lodash/max'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import round from 'lodash/round'
import sortBy from 'lodash/sortBy'
import startCase from 'lodash/startCase'
import sum from 'lodash/sum'
import sumBy from 'lodash/sumBy'
import times from 'lodash/times'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import values from 'lodash/values'
import valuesIn from 'lodash/valuesIn'
import addDays from 'date-fns/addDays'
import addMinutes from 'date-fns/addMinutes'
import format from 'date-fns/format'
import startOfMonth from 'date-fns/startOfMonth'
import subMinutes from 'date-fns/subMinutes'
import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'

import graphSchema from '../Schemas/graphSchema'
import graphColorMap from '../Variables'

const makeProperCase = string => startCase(string)

const getDayFromToday = cnt => format(addDays(new Date(), cnt), 'yyyy-MM-dd')

const calcPercentageForGraphs = (value, total, precision = 4) =>
  ((value / total) * 100).toFixed(precision)

const negateTimeZoneOffset = dateString => {
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()

  return Math.sign(offset) !== -1
    ? addMinutes(date, offset)
    : subMinutes(date, Math.abs(offset))
}

const getTimePeriod = (cnt, period, dateFormat) => {
  let timePeriod
  const dateNow = new Date()
  switch (true) {
    case period === 'hours':
      timePeriod = subDays(dateNow, cnt)
      break
    case period === 'days':
      timePeriod = subDays(dateNow, cnt)
      break
    case period === 'months':
      timePeriod = startOfMonth(subMonths(dateNow, cnt))
      break

    default:
      timePeriod = dateNow
      break
  }

  return format(timePeriod, dateFormat)
}

const normaliseKeys = data => {
  const normalised = []
  for (const [key, value] of Object.entries(data)) {
    normalised.push({ ...value })
  }
  return normalised
}

const filterByMultiple = (data, filterBy) => {
  return data.filter(d =>
    keys(filterBy).every(f => includes(filterBy[f].values, d[f]))
  )
}

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

const groupForOldTreatmentAPI = (data, keyToConsume, indexBy, filterBy) => {
  const grouped = data.reduce((acc, curr) => {
    acc[curr[indexBy]] = {
      monthTested: curr[indexBy],
      Confirmed: Number(curr[keyToConsume]).toFixed(1),
      NotConfirmed: Number(100 - curr[keyToConsume]).toFixed(1),
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

const formatValuesForGraphs = (value, displayMethod, formatNumber) => {
  let formatted
  switch (true) {
    case (typeof value === 'number' || !Number.isNaN(Number(value))) &&
      displayMethod === 'actual':
      formatted = formatNumber(Math.abs(value), {
        notation: 'compact',
        compactDisplay: 'short',
      })
      break

    case (typeof value === 'number' || !Number.isNaN(Number(value))) &&
      displayMethod === 'percentage':
      formatted = formatNumber(Number(value / 100), {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
      break

    default:
      formatted = value
      break
  }
  return formatted
}

const orderKeysById = keys => {
  const sortedKeys = []
  keys.map(k =>
    graphColorMap.filter(
      ({ id, externalId }) =>
        externalId === k && sortedKeys.push({ id, externalId })
    )
  )
  return map(sortBy(sortedKeys, ['id']), 'externalId')
}

const getGraphKeysFromResults = (data, keyToOmit) => {
  const newdata = []
  data.filter(d =>
    forOwn(
      d,
      (value, key) => keyToOmit === key || newdata.push({ [key]: value })
    )
  )
  return orderKeysById(uniq(newdata.flatMap(a => keys(a))))
}

const getMaxValueForDivergent = data => {
  const keyValues = []
  data.map(d =>
    values(d).map(v => Number.isInteger(v) && keyValues.push(Math.abs(v)))
  )
  const maxVal = max(keyValues) % 2 === 0 ? max(keyValues) : max(keyValues) + 1
  return { minValue: -maxVal, maxValue: maxVal }
}

const roundIfNumber = value =>
  typeof value === 'number' && value > 0 ? Math.round(value) : value

const sortByValue = values => {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  })
  return values.sort(collator.compare)
}

const clubsandwich = (boundaries, rounded = false) => {
  const low = first(boundaries)
  const high = last(boundaries)
  const middle = high / 2
  return [low, rounded ? roundIfNumber(middle) : middle, high]
}

const getBoundaries = (data, keys, whichAxes, zeroOut = true) => {
  let dataOut
  const dataOutTemp = zeroOut && whichAxes === 'Y' ? [0] : []
  switch (whichAxes) {
    case 'Y':
      data.map(d => dataOutTemp.push(sum(values(pick(d, keys)).map(Number))))
      dataOut = sortByValue(dataOutTemp)
      break

    default:
      data.map(d => dataOutTemp.push(...valuesIn(pick(d, keys))))
      dataOut = dataOutTemp
      break
  }
  return [roundIfNumber(first(dataOut)), roundIfNumber(last(dataOut))]
}

const generateTickValues = (
  data,
  axesTicks,
  keys,
  whichAxes,
  zeroOut = false
) => {
  let values
  const boundaries = getBoundaries(data, keys, whichAxes, zeroOut)
  switch (axesTicks) {
    case 'none':
      values = 0
      break

    case 'bookends':
      values = boundaries
      break

    case 'clubsandwich':
      values = clubsandwich(boundaries)
      break

    default:
      break
  }
  return values
}

const filterColour = value =>
  graphColorMap.filter(
    color => color.externalId === value || color.id === 99
  )[0].color

const generateColorForValue = ({ id: valueId }) => filterColour(valueId)
const generateColorForLegend = value => filterColour(value)

const calcPercentageSplitBar = (data, keyToOmit, displayMethod) => {
  return displayMethod === 'actual'
    ? data
    : data.map(d => {
        const dSum = sum(values(omit(d, keyToOmit)))
        forOwn(d, (value, key) => {
          if (key !== keyToOmit) {
            d[key] = calcPercentageForGraphs(value, dSum)
          }
        })
        return d
      })
}

const generateMargin = (tickValuesYShape, legend) => {
  const shouldMargin = tickValuesYShape !== 'none'
  const margin = {
    top: 5,
    right: shouldMargin ? 20 : 0,
    bottom: legend ? 60 : 0,
    left: shouldMargin ? 40 : 0,
  }

  return margin
}

const generateToolTip = (
  item,
  displayMethod,
  assaysFromState,
  formatNumber
) => {
  const { color, id, indexValue, value } = item
  const displayId = translateLabel(id, assaysFromState)
  const displayValue = formatValuesForGraphs(value, displayMethod, formatNumber)
  return { color, displayId, indexValue, displayValue }
}

const translateLabel = (string, assaysFromState) => {
  const dictionary = []
  assaysFromState.map(({ resultCategories }) =>
    resultCategories.map(({ externalId, name }) =>
      dictionary.push({ externalId, name })
    )
  )
  const assayResults = uniqBy(dictionary, 'externalId')
  const newString = assayResults.filter(
    ({ externalId }) => externalId === string
  )
  return newString.length ? newString[0].name : makeProperCase(string)
}

const generateLegend = (string, assaysFromState) => {
  return {
    label: translateLabel(string, assaysFromState),
    color: generateColorForLegend(string),
  }
}

const percentageOrActualForPie = (data, displayMethod) => {
  let newData = []
  if (displayMethod === 'percentage') {
    const total = data.reduce((acc, curr) => acc + curr.value, 0)
    data.map((d, i) =>
      newData.push({ ...d, value: calcPercentageForGraphs(d.value, total) })
    )
  } else {
    newData = data
  }
  return newData
}

const getAverageFromData = (data, value, which, culture) => {
  if (data.length && which) {
    let totalForFilter = []
    const total = []
    data.map(d => total.push(sum(values(pick(d, value)).map(Number))))
    if (Array.isArray(which)) {
      const rangeTotal = which.reduce((acc, curr) => {
        const item = filter(data, ['label', curr])[0]
        if (item) {
          if (acc && acc.id) {
            acc[value] += parseFloat(item[value])
          } else {
            acc = {
              ...item,
              [value]: parseFloat(item[value]),
            }
          }
        } else {
          // eslint-disable-next-line no-console
          console.error(
            `There are no results to match your config for item: ${curr}`
          )
        }
        return acc
      }, {})

      if (
        Object.keys(rangeTotal).length !== 0 &&
        rangeTotal.constructor === Object
      ) {
        totalForFilter.push(rangeTotal)
      }
    } else {
      totalForFilter = filter(data, ['label', which]) || [{ [value]: 0 }]
    }

    if (totalForFilter && totalForFilter.length) {
      const sumData = data.reduce(
        (acc, curr) => acc + parseFloat(curr.value),
        0
      )
      const avg = calcPercentageForGraphs(
        parseFloat(totalForFilter[0][value]),
        round(sumData),
        1
      )
      return {
        avg: parseFloat(avg),
        color: filterColour(totalForFilter[0].id),
        totals: new Intl.NumberFormat(culture, {
          notation: 'standard',
        }).format(Number(sum(total))),
      }
    }
    // eslint-disable-next-line no-console
    console.error('There are no data that match your config')
  }
  return {}
}

const validateGraphConfig = config => {
  return new Promise((res, rej) => {
    const ajv = new Ajv()
    const { id } = config
    const CLASSES = { Function }

    ajv.addKeyword('instanceof', {
      compile: schema => data => data instanceof CLASSES[schema],
    })

    return ajv.validate(graphSchema, config)
      ? res(true)
      : // eslint-disable-next-line no-console
        console.error(`Graph config error for ${id}: ${ajv.errorsText()}`)
  })
}

const formatDataByGraphType = (
  data,
  displayMethod,
  filterBy,
  formatDate,
  indexBy,
  keyToConsume,
  type
) => {
  let grouped
  switch (type) {
    case 'bar':
    case 'calendar':
    case 'stacked':
      grouped = groupByKey(
        data,
        indexBy,
        keyToConsume,
        displayMethod,
        formatDate,
        filterBy
      )
      break

    case 'divergent':
      grouped = groupForDivergent(data, indexBy, keyToConsume, filterBy)
      break

    case 'pie':
      grouped = groupForPie(data, keyToConsume, indexBy, filterBy)
      break

    default:
      grouped = false
      break
  }

  return grouped
}

export {
  calcPercentageSplitBar,
  formatDataByGraphType,
  formatValuesForGraphs,
  generateColorForLegend,
  generateColorForValue,
  generateLegend,
  generateMargin,
  generateTickValues,
  generateToolTip,
  getAverageFromData,
  getDayFromToday,
  getGraphKeysFromResults,
  getMaxValueForDivergent,
  getTimePeriod,
  graphColorMap,
  groupByKey,
  groupForDivergent,
  groupForOldTreatmentAPI,
  groupForPie,
  groupForPieOldTreatmentAPI,
  normaliseKeys,
  percentageOrActualForPie,
  validateGraphConfig,
}
