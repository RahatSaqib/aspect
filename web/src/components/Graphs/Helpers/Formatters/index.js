import first from 'lodash/first'
import get from 'lodash/get'
import includes from 'lodash/includes'
import keys from 'lodash/keys'
import last from 'lodash/last'
import map from 'lodash/map'
import max from 'lodash/max'
import nth from 'lodash/nth'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import sortBy from 'lodash/sortBy'
import split from 'lodash/split'
import startCase from 'lodash/startCase'
import sum from 'lodash/sum'
import times from 'lodash/times'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import values from 'lodash/values'
import valuesIn from 'lodash/valuesIn'
import {
  dateRangeOptions,
  getISOFromString,
  getTimePeriod,
  getPreviousPeriod,
  negateTimeZoneOffset,
} from '../../../../components/shared/DateTimeInput/utils/date'
import { calcPercentageSplitBar, calcPercentageForGraphs, roundIfNumber } from './calcs'
import {
  groupByKey,
  groupForPie,
  groupForDivergent,
  groupForOldTreatmentAPI,
  groupForDeviceStatusAPI,
} from './grouping'

const makeProperCase = string => startCase(string)

const normaliseKeys = data => {
  const normalised = []
  for (const [keyIgnored, value] of Object.entries(data)) {
    normalised.push({ ...value })
  }
  return normalised
}

const filterByMultiple = (data, filterBy) => {
  return data.filter(d => keys(filterBy).every(f => includes(filterBy[f].values, d[f])))
}

const formatValuesForGraphs = (value, displayMethod, { formatNumber }) => {
  let formatted
  switch (true) {
    case (typeof value === 'number' || !Number.isNaN(Number(value))) && displayMethod === 'actual':
      formatted = formatNumber(Math.abs(value), {
        notation: 'compact',
        compactDisplay: 'short',
      })
      break

    case (typeof value === 'number' || !Number.isNaN(Number(value))) && displayMethod === 'percentage':
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
  return uniq([low, rounded ? roundIfNumber(middle) : middle, high])
}

const getBoundaries = (data, keys, { whichAxes, zeroOut, groupMode }) => {
  let dataOut
  const dataOutTemp = zeroOut && whichAxes === 'Y' ? [0] : []
  switch (whichAxes) {
    case 'Y': {
      const aggregationFunc = groupMode === 'grouped' ? max : sum
      data.map(d => dataOutTemp.push(aggregationFunc(values(pick(d, keys)).map(Number))))
      dataOut = sortByValue(dataOutTemp)
      break
    }

    default:
      data.map(d => dataOutTemp.push(...valuesIn(pick(d, keys))))
      dataOut = dataOutTemp
      break
  }
  return [roundIfNumber(first(dataOut)), roundIfNumber(last(dataOut))]
}

const incrementSplit = (boundaries, increment) => {
  if (boundaries[1] === 1) {
    return boundaries
  }
  const split = Math.round(boundaries[1] / increment)
  const values = [boundaries[0], split * increment]
  times(split, v => values.push(v * increment))
  return sortBy(uniq(values))
}

const generateTickValues = (data, axesTicks, keys, whichAxes, zeroOut = false, { groupMode } = {}) => {
  if (axesTicks === 'all') {
    return data.map(d => d[keys])
  }

  let values
  const boundaries = getBoundaries(data, keys, { whichAxes, zeroOut, groupMode })
  const upperBoundary = boundaries[1] || 0
  const dynamicAxesTicks = upperBoundary > 40 && !['none', 'bookends'].includes(axesTicks) ? 'clubsandwich' : axesTicks

  switch (dynamicAxesTicks) {
    case 'none':
      values = 0
      break

    case 'bookends':
      values = boundaries
      break

    case 'clubsandwich':
      values = clubsandwich(boundaries)
      break

    case 'twos':
      values = incrementSplit(boundaries, 2)
      break

    case 'threes':
      values = incrementSplit(boundaries, 3)
      break

    default:
      break
  }
  return values
}

const generateToolTip = (
  item,
  displayMethod,
  assaysFromState,
  formatNumber,
  type,
  formatMessage,
  intlMessages,
  i18nKeys = {}
) => {
  const { color, id, indexValue, value, data } = item
  let displayValue = ''
  let displayId = translateLabel(id, assaysFromState, formatMessage, intlMessages, i18nKeys)
  if (type === 'stackedDeviceActivity') {
    const { devicesTotal } = data
    const valuePercentage = parseFloat(`${value}%`) / 100
    const displayCount = Math.round(devicesTotal * valuePercentage)
    const displayTitle = formatMessage(intlMessages[`device${displayCount === 1 ? '' : 's'}`])

    displayValue = `${displayCount} ${displayTitle}`
  } else if (type === 'solid') {
    displayValue = value
  } else if (type === 'barInventory') {
    displayId = formatMessage(intlMessages.location)
    displayValue = value
  } else if (type === 'bar' || type === 'barLegacyTreatment') {
    let totalOut = 0
    const { totalCnt } = data || false

    if (!totalCnt) {
      const out = []
      map(omit(data, ['month']), k => out.push(k))
      totalOut = sum(out)
    } else {
      totalOut = totalCnt
    }
    const percentage = formatValuesForGraphs(value, displayMethod, {
      formatNumber,
    })
    const percentageToValue = Math.round((parseFloat(value) / 100) * totalCnt)
    displayValue = {
      value: percentage,
      actual: { totalCnt: totalOut, percentageToValue },
    }
  } else {
    displayValue = formatValuesForGraphs(value, displayMethod, { formatNumber })
  }
  return { color, displayId, indexValue, displayValue, externalId: id }
}

const removeStringsFromArray = string => {
  const removeStrings = ['devices', 'inactive']
  const newString = removeStrings.map(removeString => string.replace(removeString, ''))
  return newString.length > 1 ? newString[1] : newString[0]
}

const translateLabel = (string, assaysFromState, formatMessage, intlMessages, i18nKeys) => {
  const dictionary = []
  assaysFromState.map(
    ({ resultCategories }) =>
      Array.isArray(resultCategories) &&
      resultCategories.map(
        ({ resultCategories }) =>
          Array.isArray(resultCategories) &&
          resultCategories.map(({ externalId, name }) => dictionary.push({ externalId, name }))
      )
  )

  const assayResults = uniqBy(dictionary, 'externalId')
  const newString = assayResults.filter(({ externalId }) => externalId === string)
  return formatMessage && intlMessages[i18nKeys[string]]
    ? formatMessage(intlMessages[i18nKeys[string]]) || get(nth(newString, 0), 'name')
    : makeProperCase(removeStringsFromArray(string))
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
        assayTypeId: selectedOption ? split(selectedOption.id, '-', 1)[0] : null,
        resultCategoryId: selectedOption ? split(selectedOption.id, '-', 2)[1] : null,
      }
      break

    case 'consumableId':
      optionValue = {
        consumableId: selectedOption ? selectedOption.consumableId : null,
      }
      break
    case 'consumableExternalId':
      optionValue = {
        consumableExternalId: selectedOption ? selectedOption.consumableExternalId : null,
      }
      break
    default:
      break
  }
  return optionValue
}

export {
  calcPercentageSplitBar,
  calcPercentageForGraphs,
  dateRangeOptions,
  extractOptionValue,
  filterByMultiple,
  generateTickValues,
  generateToolTip,
  getISOFromString,
  getPreviousPeriod,
  getTimePeriod,
  groupByKey,
  groupForDeviceStatusAPI,
  groupForDivergent,
  groupForOldTreatmentAPI,
  groupForPie,
  negateTimeZoneOffset,
  normaliseKeys,
}
