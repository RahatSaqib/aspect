import assign from 'lodash/assign'
import without from 'lodash/without'
import omit from 'lodash/omit'
import map from 'lodash/map'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import round from 'lodash/round'
import filter from 'lodash/filter'
import sum from 'lodash/sum'
import values from 'lodash/values'
import includes from 'lodash/includes'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import startCase from 'lodash/startCase'
import addMinutes from 'date-fns/addMinutes'
import subMinutes from 'date-fns/subMinutes'
import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'
import startOfMonth from 'date-fns/startOfMonth'
import format from 'date-fns/format'
import addDays from 'date-fns/addDays'
import first from 'lodash/first'
import last from 'lodash/last'
import maxBy from 'lodash/maxBy'
import minBy from 'lodash/minBy'
import sortBy from 'lodash/sortBy'
import valuesIn from 'lodash/valuesIn'
import forOwn from 'lodash/forOwn'
import keys from 'lodash/keys'

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

const normaliseKeys = (data, indexBy, filterResults = false) => {
  const normalised = []
  for (const [key, value] of Object.entries(data)) {
    const newValue = filterResults
      ? pickBy(value, (v, k) => includes([...filterResults, indexBy], k))
      : value
    normalised.push({ ...newValue })
  }
  return normalised
}

const groupByKey = (
  data,
  indexBy,
  keyToConsume = false,
  displayMethod = 'actual',
  formatDate = false,
  intl = false
) => {
  const grouped = data.reduce((acc, curr) => {
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

  return calcPercentageSplitBar(
    normaliseKeys(grouped, indexBy),
    indexBy,
    displayMethod
  )
}

const groupForPie = (
  data,
  keyToConsume,
  indexBy,
  displayMethod = 'percentage',
  filterResults = false
) => {
  const { key: filterKey, value: filterValue } = filterResults
  const dataToConsume = filterResults
    ? filter(data, [filterKey, filterValue])
    : data

  return dataToConsume.reduce((acc, curr) => {
    const total = dataToConsume.reduce((acc, curr) => acc + curr.cnt, 0)
    const label = curr[keyToConsume]
    acc.push({
      id: curr[keyToConsume],
      label,
      value:
        displayMethod === 'percentage'
          ? calcPercentageForGraphs(curr[indexBy], total)
          : curr[indexBy],
    })
    return acc
  }, [])
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
  data.filter(d => {
    return forOwn(
      d,
      (value, key) => keyToOmit === key || newdata.push({ [key]: value })
    )
  })
  return orderKeysById(uniq(newdata.flatMap(a => keys(a))))
}

const clubsandwich = (boundaries, rounded = false) => {
  const low = first(boundaries)
  const high = last(boundaries)
  const middle = high / 2
  return [low, rounded ? Math.round(middle) : middle, high]
}

const getBoundaries = (data, keys, whichAxes, zeroOut = true) => {
  const keySumValues = zeroOut ? [0] : []
  if (whichAxes === 'Y') {
    data.map(d => keySumValues.push(sum(values(pick(d, keys)))))
  } else {
    data.map(d => keySumValues.push(...valuesIn(pick(d, keys))))
  }
  const sorted = keySumValues.sort((a, b) => a - b)
  return [first(sorted), last(sorted)]
}

const generateTickVales = (data, axesTicks, keys, whichAxes, zeroOut) => {
  const boundaries = getBoundaries(data, keys, whichAxes, zeroOut)
  let values
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

const generateMargin = (tickValuesY, legend) => {
  const shouldMargin = tickValuesY !== 'none'
  const margin = {
    top: shouldMargin ? 10 : 0,
    right: shouldMargin ? 20 : 0,
    bottom: legend ? 60 : 0,
    left: shouldMargin ? 40 : 0,
  }

  return margin
}

const generateToolTip = (item, culture, displayMethod, assaysFromState) => {
  const { color, id, indexValue, value } = item
  const displayId = translateLabel(id, assaysFromState)
  const displayValue =
    displayMethod === 'percentage'
      ? new Intl.NumberFormat(culture, {
          style: 'percent',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(Number(value / 100))
      : new Intl.NumberFormat(culture, {
          notation: 'compact',
          compactDisplay: 'short',
        }).format(Number(value))

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

const getAverageFromData = (data, value, which, culture) => {
  if (data.length && which) {
    let total = []
    if (Array.isArray(which)) {
      const rangeTotal = which.reduce((acc, curr) => {
        const item = filter(data, ['label', curr])[0]
        if (item) {
          if (acc && acc.id) {
            acc[value] += parseFloat(item[value])
          } else {
            acc = { ...item, [value]: parseFloat(item[value]) }
          }
        } else {
          console.error(
            `There are no results to match your config. item: ${item}`
          )
        }
        return acc
      }, {})

      if (
        Object.keys(rangeTotal).length !== 0 &&
        rangeTotal.constructor === Object
      ) {
        total.push(rangeTotal)
      }
    } else {
      total = filter(data, ['label', which]) || [{ [value]: 0 }]
    }

    if (total && total.length) {
      const sum = data.reduce((acc, curr) => acc + parseFloat(curr.value), 0)
      const avg = calcPercentageForGraphs(
        parseFloat(total[0][value]),
        round(sum),
        1
      )
      return {
        avg: parseFloat(avg),
        color: filterColour(total[0].id),
        totals: new Intl.NumberFormat(culture, {
          notation: 'standard',
        }).format(Number(total[0].value)),
      }
    }
    console.error('There are no data that match your config')
  }
  return {}
}

export {
  calcPercentageSplitBar,
  getAverageFromData,
  getDayFromToday,
  graphColorMap,
  generateColorForLegend,
  generateColorForValue,
  generateLegend,
  generateMargin,
  generateTickVales,
  generateToolTip,
  getGraphKeysFromResults,
  groupByKey,
  groupForPie,
}
