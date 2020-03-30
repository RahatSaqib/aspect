import without from 'lodash/without'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import round from 'lodash/round'
import filter from 'lodash/filter'
import sum from 'lodash/sum'
import values from 'lodash/values'
import includes from 'lodash/includes'
import pickBy from 'lodash/pickBy'
import subDays from 'date-fns/subDays'
import subMonths from 'date-fns/subMonths'
import startOfMonth from 'date-fns/startOfMonth'
import format from 'date-fns/format'

const defaultColor = '#ECECEC'

const graphColorMap = [
  { id: 1, externalId: 'MoreThan1000', color: '#D60000' },
  { id: 2, externalId: 'LessThan1000', color: '#FFC9C4' },
  { id: 3, externalId: 'Indeterminate', color: '#00CA1C' },
  { id: 4, externalId: 'Detected', color: '#D60000' },
  { id: 5, externalId: 'NotDetected', color: '#00CA1C' },
  { id: 6, externalId: 'Invalid', color: defaultColor },
  { id: 7, externalId: 'NoResult', color: '#FFC9C4' },
  { id: 8, externalId: 'Error', color: '#000000' },
  { id: 9, externalId: 'Positive', color: '#FFB300' },
  { id: 10, externalId: 'Inconclusive', color: '#FFC9C4' },
  { id: 11, externalId: 'Unknown', color: defaultColor },
  { id: 12, externalId: 'Negative', color: '#00CA1C' },
  { id: 99, externalId: 'Cases', color: '#00CA1C' },
]

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

const groupByKey = (data, key, cntKey = false, formatDate = false) => {
  const flatMapSortMap = graphColorMap.reduce((acc, curr) => {
    const newCurr = omit(curr, 'id', 'color')
    acc.push(newCurr.externalId)
    return acc
  }, [])

  const dataToConsume = cntKey
    ? data.sort(
        (a, b) =>
          flatMapSortMap.indexOf(a[cntKey]) - flatMapSortMap.indexOf(b[cntKey])
      )
    : data

  return dataToConsume.reduce((acc, curr) => {
    const countKey = cntKey
      ? curr[cntKey]
      : filter(graphColorMap, ['id', 99])[0].externalId
    acc[curr[key]] = {
      ...acc[curr[key]],
      [key]: formatDate ? format(new Date(curr[key]), formatDate) : curr[key],
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
          ? round((curr[value] / total) * 100)
          : curr[value],
      color: (colorKey && colorKey.color) || defaultColor,
    })
    return acc
  }, [])
}

const getAverageFromData = (data, value, which) => {
  const total = filter(data, ['label', which])
  const sum = data.reduce((acc, curr) => acc + curr.value, 0)
  return { avg: round((total[0][value] / sum) * 100), color: total[0].color }
}

const calcPercentageSplitBar = (data, keyToOmitDuringCalc) => {
  return data.reduce((acc, curr, index) => {
    const dataPoints = omit(curr, keyToOmitDuringCalc)
    const total = sum(values(dataPoints))

    acc.push({
      [keyToOmitDuringCalc]: curr[keyToOmitDuringCalc],
    })

    for (const [key, value] of Object.entries(dataPoints)) {
      const val = parseInt(value, 11)
      acc[index][key] = ((val / total) * 100).toFixed(2)
    }

    return acc
  }, [])
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
        newItem[`${newKey}Color`] = (colorKey && colorKey.color) || defaultColor
      }

      newItem[`${newKey}`] = value
    }
    return translated.push({ ...newItem })
  })

  return translated
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

const buildAssaysFromWhitelist = (data, whiteList) =>
  data.reduce((acc, curr) => {
    whiteList.filter(w => {
      if (w.id === curr.externalId) {
        acc.push({ ...w, ...curr })
      }
      return acc
    })
    return acc
  }, [])

export {
  buildAssaysFromWhitelist,
  calcPercentageSplitBar,
  formatDataForPie,
  getAverageFromData,
  getTimePeriod,
  getKeysFromResults,
  groupByKey,
  normaliseKeys,
  translateKeys,
}
