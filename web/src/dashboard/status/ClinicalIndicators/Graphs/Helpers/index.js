import without from 'lodash/without'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import round from 'lodash/round'
import filter from 'lodash/filter'
import sortBy from 'lodash/sortBy'
import sum from 'lodash/sum'
import values from 'lodash/values'
import includes from 'lodash/includes'
import { format } from 'date-fns'

const graphColorMap = [
  { id: 1, externalId: 'MoreThan1000', color: '#D60000' },
  { id: 2, externalId: 'LessThan1000', color: '#FFC9C4' },
  { id: 3, externalId: 'Indeterminate', color: '#00CA1C' },
  { id: 4, externalId: 'Detected', color: '#D60000' },
  { id: 5, externalId: 'NotDetected', color: '#00CA1C' },
  { id: 6, externalId: 'Invalid', color: '#ececec' },
  { id: 7, externalId: 'NoResult', color: '#FFC9C4' },
  { id: 8, externalId: 'Error', color: '#000000' },
]

const getKeysFromResults = (data, keyToOmit, orderBy) => {
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

const groupByKey = (data, key, cntKey, formatDate = false) => {
  const flatMapSortMap = graphColorMap.reduce((acc, curr) => {
    const newCurr = omit(curr, 'id', 'color')
    acc.push(newCurr.externalId)
    return acc
  }, [])

  return data
    .sort(
      (a, b) =>
        flatMapSortMap.indexOf(a[cntKey]) - flatMapSortMap.indexOf(b[cntKey])
    )
    .reduce((acc, curr) => {
      acc[curr[key]] = {
        ...acc[curr[key]],
        [key]: formatDate ? format(new Date(curr[key]), formatDate) : curr[key],
        [curr[cntKey]]: curr.cnt,
      }
      return acc
    }, {})
}

const normaliseKeys = data => {
  const normalised = []
  for (const [key, value] of Object.entries(data)) {
    normalised.push({ ...value })
  }
  return normalised
}

const formatDataForPie = (data, key, value, assayFromState) => {
  const { resultCategories } = assayFromState

  return data.reduce((acc, curr) => {
    const newKey = resultCategories.filter(r => r.externalId === curr[key])[0]
    const label = (newKey && newKey.name) || curr[key]
    const colorKey = graphColorMap.filter(c => c.externalId === curr[key])[0]
    acc.push({
      id: curr[key],
      label,
      value: curr[value],
      color: colorKey.color || false,
    })
    return acc
  }, [])
}

const getAverageFromData = (data, value) => {
  const total = filter(data, ['id', data[0].id])
  const sum = data.reduce((acc, curr) => acc + curr.value, 0)

  return round((total[0][value] / sum) * 100)
}

const calcPercentageSplit = (data, keyToOmitDuringCalc) => {
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
        if (colorKey && colorKey.color) {
          newItem[`${newKey}Color`] = colorKey.color
        }
      }

      newItem[`${newKey}`] = value
    }
    return translated.push({ ...newItem })
  })

  return translated
}

export {
  calcPercentageSplit,
  formatDataForPie,
  getAverageFromData,
  getKeysFromResults,
  groupByKey,
  normaliseKeys,
  translateKeys,
}
