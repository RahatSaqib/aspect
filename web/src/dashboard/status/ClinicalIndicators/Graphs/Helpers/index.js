import without from 'lodash/without'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import round from 'lodash/round'
import filter from 'lodash/filter'
import sum from 'lodash/sum'
import values from 'lodash/values'
import includes from 'lodash/includes'
import pickBy from 'lodash/pickBy'
import addMinutes from 'date-fns/addMinutes'
import subMinutes from 'date-fns/subMinutes'
import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'
import startOfMonth from 'date-fns/startOfMonth'
import format from 'date-fns/format'
import addDays from 'date-fns/addDays'

import variables from '../../../../../../cfg/variables.js'

const envSource =
  process.env && process.env.initialised
    ? process.env
    : Object.assign(process.env, variables.customPropertiesVariables)

const {
  '--aspect-color-black': colorBlack,
  '--aspect-color-mandy': colorMandy,
  '--aspect-color-mantis': colorMantis,
  '--aspect-color-pink': colorPink,
  '--aspect-color-white-4': colorWhite4,
} = envSource

const graphColorMap = [
  { id: 1, externalId: 'MoreThan1000', color: colorMandy },
  { id: 2, externalId: 'LessThan1000', color: colorPink },
  { id: 3, externalId: 'LessThan150', color: colorPink },
  { id: 4, externalId: 'LessThan40', color: colorPink },
  { id: 5, externalId: 'MoreThan40', color: colorPink },
  { id: 6, externalId: 'Detected', color: colorMandy },
  { id: 7, externalId: 'Indeterminate', color: colorPink },
  { id: 8, externalId: 'NotDetected', color: colorMantis },
  { id: 9, externalId: 'Invalid', color: colorWhite4 },
  { id: 10, externalId: 'NoResult', color: colorPink },
  { id: 11, externalId: 'Error', color: colorBlack },
  { id: 12, externalId: 'Positive', color: colorMantis },
  { id: 13, externalId: 'Inconclusive', color: colorPink },
  { id: 14, externalId: 'Unknown', color: colorWhite4 },
  { id: 15, externalId: 'Negative', color: colorMantis },
  { id: 99, externalId: 'Cases', color: colorMantis },
]

const getDayFromToday = cnt => format(addDays(new Date(), cnt), 'yyyy-MM-dd')

const negateTimeZoneOffset = dateString => {
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()

  return Math.sign(offset) !== -1
    ? addMinutes(date, offset)
    : subMinutes(date, Math.abs(offset))
}

const calcPercentageForGraphs = (value, total, precision = 4) =>
  ((value / total) * 100).toFixed(precision)

const getKeysFromResults = (data, keyToOmit) => {
  const newdata = []
  data.filter(d => {
    for (const [key, value] of Object.entries(d)) {
      if (!includes(key, 'Color')) {
        newdata.push({ [key]: value })
      }
    }
    return newdata
  })

  const res = uniq(newdata.flatMap(a => Object.keys(a)))

  return keyToOmit ? without(res, keyToOmit) : res
}

const groupByKey = (data, key, keyToConsume = false, formatDate = false) => {
  return data.reduce((acc, curr) => {
    const countKey = keyToConsume
      ? curr[keyToConsume]
      : filter(graphColorMap, ['id', 99])[0].externalId

    const dateFormatted = formatDate
      ? format(negateTimeZoneOffset(curr[key]), formatDate)
      : curr[key]

    acc[curr[key]] = {
      ...acc[curr[key]],
      [key]: dateFormatted,
      [countKey]: curr.cnt,
    }
    return acc
  }, {})
}

const normaliseKeys = (data, filterResults = false, indexBy) => {
  const normalised = []
  for (const [key, value] of Object.entries(data)) {
    const newValue = filterResults
      ? pickBy(value, (v, k) => includes([...filterResults, indexBy], k))
      : value

    normalised.push({ ...newValue })
  }
  return normalised
}

const formatDataForPie = (
  data,
  key,
  value,
  assayFromState,
  displayMethod = 'percentage',
  filterResults
) => {
  const { resultCategories } = assayFromState
  const { key: filterKey, value: filterValue } = filterResults

  const dataToConsume = filterResults
    ? filter(data, [filterKey, filterValue])
    : data

  return dataToConsume.reduce((acc, curr) => {
    const total = dataToConsume.reduce((acc, curr) => acc + curr.cnt, 0)
    const newKey = resultCategories.filter(r => r.externalId === curr[key])[0]
    const label = (newKey && newKey.name) || curr[key]
    const colorKey = graphColorMap.filter(c => c.externalId === curr[key])[0]
    acc.push({
      id: curr[key],
      label,
      value:
        displayMethod === 'percentage'
          ? calcPercentageForGraphs(curr[value], total)
          : curr[value],
      color: (colorKey && colorKey.color) || colorWhite4,
    })
    return acc
  }, [])
}

const getAverageFromData = (data, value, which) => {
  if (data.length && which) {
    let total = []
    if (Array.isArray(which)) {
      const rangeTotal = which.reduce((acc, curr) => {
        const item = filter(data, ['label', curr])[0]
        if (acc && acc.id) {
          acc[value] += parseFloat(item[value])
        } else {
          acc = { ...item, [value]: parseFloat(item[value]) }
        }
        return acc
      }, {})
      total.push(rangeTotal)
    } else {
      total = filter(data, ['label', which])
    }

    const sum = data.reduce((acc, curr) => acc + parseFloat(curr.value), 0)
    const avg = calcPercentageForGraphs(
      parseFloat(total[0][value]),
      round(sum),
      1
    )
    return {
      avg: parseFloat(avg),
      color: total[0].color,
    }
  }
  return {}
}

const calcPercentageSplitBar = (data, keyToOmitDuringCalc) => {
  return data.reduce((acc, curr, index) => {
    const dataPoints = omit(curr, keyToOmitDuringCalc)
    const total = sum(values(dataPoints))

    acc.push({
      [keyToOmitDuringCalc]: curr[keyToOmitDuringCalc],
    })

    for (const [key, value] of Object.entries(dataPoints)) {
      acc[index][key] = calcPercentageForGraphs(value, total)
    }

    return acc
  }, [])
}

const sortByColourID = data => {
  const sorted = []
  data.map(item => {
    const newItem = {}
    const keys = Object.keys(item).sort(function(a, b) {
      return item[a] - item[b]
    })
    keys.map(key => {
      newItem[key] = item[key]
      return newItem
    })
    return sorted.push(newItem)
  })

  return sorted
}

const translateKeys = (data, assayFromState, colorise = false) => {
  const translated = []
  const { resultCategories } = assayFromState

  data.map(item => {
    const newItem = {}
    for (const [key, value] of Object.entries(item)) {
      const matchedKey = resultCategories.filter(r => r.externalId === key)[0]
      const newKey = matchedKey && matchedKey.name ? matchedKey.name : key

      if (colorise) {
        const colorKey = graphColorMap.filter(c => c.externalId === key)[0]
        newItem[`${newKey}Color Order`] = (colorKey && colorKey.id) || 0
        newItem[`${newKey}Color`] = (colorKey && colorKey.color) || colorWhite4
      }

      newItem[`${newKey}`] = value
    }
    return translated.push({ ...newItem })
  })

  return sortByColourID(translated)
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

const buildAssaysFromWhitelist = (data, whiteList) => {
  const isAllowed = inID => data.filter(d => inID === d.externalId)

  return whiteList.reduce((acc, curr) => {
    const { id } = curr
    if (Array.isArray(id)) {
      const tempAssayIds = []
      const tempAssay = []
      id.map(i => {
        if (isAllowed(i).length > 0) {
          tempAssayIds.push(i)
          if (tempAssay.length < 1) {
            tempAssay.push({ ...isAllowed(i)[0] })
          }
        }
        return tempAssay
      })
      if (tempAssayIds.length && tempAssay.length) {
        acc.push({
          ...curr,
          ...tempAssay[0],
          externalId: tempAssayIds,
        })
      }
    } else if (isAllowed(id).length > 0) {
      acc.push({ id, ...curr, ...isAllowed(id)[0], externalId: id })
    }
    return acc
  }, [])
}

export {
  buildAssaysFromWhitelist,
  calcPercentageSplitBar,
  formatDataForPie,
  getAverageFromData,
  getDayFromToday,
  getTimePeriod,
  getKeysFromResults,
  groupByKey,
  normaliseKeys,
  translateKeys,
}
