import first from 'lodash/first'
import filter from 'lodash/filter'
import findIndex from 'lodash/findIndex'
import forOwn from 'lodash/forOwn'
import includes from 'lodash/includes'
import keys from 'lodash/keys'
import last from 'lodash/last'
import map from 'lodash/map'
import pick from 'lodash/pick'
import sortBy from 'lodash/sortBy'
import startCase from 'lodash/startCase'
import split from 'lodash/split'
import sum from 'lodash/sum'
import values from 'lodash/values'
import valuesIn from 'lodash/valuesIn'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'

import {
  dateRangeOptions,
  getDayFromToday,
  getTimePeriod,
  getPreviousPeriod,
  lastMonthLabel,
  negateTimeZoneOffset,
} from './datetime'
import {
  getMaxValueForDivergent,
  roundIfNumber,
  calcPercentageSplitBar,
  percentageOrActualForPie,
  getAverageFromData,
} from './calcs'

import {
  groupByKey,
  groupForPie,
  groupForPieRow,
  groupForDivergent,
  groupForOldTreatmentAPI,
  groupForPieOldTreatmentAPI,
  groupForDeviceStatusAPI,
} from './grouping'

import validateGraphConfig from './validate'
import graphColorMap from '../Variables'

const makeProperCase = string => startCase(string)

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

const findArrayIndexByStringPartial = (array, key, string) => {
  const formattedSearchString = string.toLowerCase()
  const index = findIndex(
    array,
    i => i[key].toLowerCase() === formattedSearchString
  )
  return index !== -1 ? index : 0
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

const generateMargin = (tickValuesYShape, legend, type = false) => {
  const shouldMargin = tickValuesYShape !== 'none'
  const bleedForLegends = type === 'stackedDeviceActivity' ? 30 : 0
  const margin = {
    top: 5,
    right: shouldMargin ? 20 + bleedForLegends : 0 + bleedForLegends,
    bottom: legend ? 60 + bleedForLegends : 0 + bleedForLegends,
    left: shouldMargin ? 40 + bleedForLegends : 0 + bleedForLegends,
  }

  return margin
}

const generateToolTip = (
  item,
  displayMethod,
  assaysFromState,
  formatNumber,
  type
) => {
  const { color, id, indexValue, value, data } = item
  let displayValue = ''
  const displayId = translateLabel(id, assaysFromState)
  if (type === 'stackedDeviceActivity') {
    const { devicesTotal } = data
    const valuePercentage = parseFloat(`${value}%`) / 100
    const displayCount = Math.round(devicesTotal * valuePercentage)
    const displayTitle = `device${displayCount === 1 ? '' : 's'}`
    displayValue = `${displayCount} ${displayTitle}`
  } else if (type === 'solid') {
    displayValue = value
  } else {
    displayValue = formatValuesForGraphs(value, displayMethod, formatNumber)
  }
  return { color, displayId, indexValue, displayValue }
}

const removeStringsFromArray = string => {
  const removeStrings = ['devices', 'inactive']
  const newString = removeStrings.map(removeString =>
    string.replace(removeString, '')
  )
  return newString.length > 1 ? newString[1] : newString[0]
}

const translateLabel = (
  string,
  assaysFromState,
  keysToRename,
  type = false
) => {
  const dictionary = keysToRename ? [...keysToRename] : []
  assaysFromState.map(
    ({ resultCategories }) =>
      Array.isArray(resultCategories) &&
      resultCategories.map(({ externalId, name }) =>
        dictionary.push({ externalId, name })
      )
  )

  const assayResults = uniqBy(dictionary, 'externalId')
  const newString = assayResults.filter(
    ({ externalId }) => externalId === string
  )

  return newString.length
    ? newString[0].name
    : makeProperCase(removeStringsFromArray(string))
}

const generateLegend = (
  string,
  assaysFromState,
  type = false,
  legendsNotToRender = false,
  keysToRename = false
) => {
  if (!legendsNotToRender.includes(string)) {
    return {
      label: translateLabel(string, assaysFromState, keysToRename, type),
      color: generateColorForLegend(string, type),
    }
  }
  return {}
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

    case 'barLegacyTreatment':
      grouped = groupForOldTreatmentAPI(
        data,
        keyToConsume,
        indexBy,
        formatDate,
        filterBy
      )
      break

    case 'stackedDeviceActivity':
      grouped = groupForDeviceStatusAPI(
        data,
        keyToConsume,
        indexBy,
        formatDate,
        filterBy
      )
      break

    case 'pieLegacyTreatment':
      grouped = groupForPieOldTreatmentAPI(
        data,
        keyToConsume,
        indexBy,
        filterBy
      )
      break

    case 'pie':
      grouped = groupForPie(data, keyToConsume, indexBy, filterBy)
      break

    case 'pieRow':
      grouped = groupForPieRow(data)
      break

    default:
      grouped = false
      break
  }
  return grouped
}

const extractOptionValue = (identifier, selectedOption) => {
  let optionValue
  switch (identifier) {
    case 'siteId':
      optionValue = {
        [identifier]: selectedOption ? selectedOption.id : null,
      }
      break

    case 'dateRange':
      optionValue =
        selectedOption && selectedOption.value
          ? {
              minDate: selectedOption.value.minDate,
              maxDate: selectedOption.value.maxDate,
            }
          : {
              minDate: getPreviousPeriod('months', 'yyyy-MM-dd').start,
              maxDate: getPreviousPeriod('months', 'yyyy-MM-dd').end,
            }
      break

    case 'currentMonth':
      optionValue =
        selectedOption && selectedOption.value
          ? {
              currentMonth: selectedOption.value.minDate,
            }
          : {
              currentMonth: getPreviousPeriod('months', 'yyyy-MM-dd').start,
            }
      break

    case 'assayTypeId':
      optionValue = {
        assayTypeId: selectedOption
          ? split(selectedOption.id, '-', 1)[0]
          : null,
        resultCategoryId: selectedOption
          ? split(selectedOption.id, '-', 2)[1]
          : null,
      }
      break

    default:
      break
  }
  return optionValue
}

export {
  calcPercentageSplitBar,
  dateRangeOptions,
  extractOptionValue,
  formatDataByGraphType,
  formatValuesForGraphs,
  filterColour,
  filterByMultiple,
  findArrayIndexByStringPartial,
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
  getPreviousPeriod,
  getTimePeriod,
  graphColorMap,
  groupByKey,
  groupForDeviceStatusAPI,
  groupForDivergent,
  groupForOldTreatmentAPI,
  groupForPie,
  groupForPieRow,
  groupForPieOldTreatmentAPI,
  lastMonthLabel,
  normaliseKeys,
  negateTimeZoneOffset,
  percentageOrActualForPie,
  validateGraphConfig,
}
