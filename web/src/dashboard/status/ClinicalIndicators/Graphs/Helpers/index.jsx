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
  { id: '1', externalId: 'Detected', color: 'hsl(0, 100%, 42%)' },
  { id: '3', externalId: 'NotDetected', color: 'hsl(10, 100%, 39.6%)' },
  { id: '4', externalId: 'Indeterminate', color: 'hsl(5, 100%, 88.4%)' },
  { id: '5', externalId: 'Invalid', color: 'hsl(42, 100%, 50%)' },
  { id: '6', externalId: 'NoResult', color: 'hsl(0, 0%, 92.5%)' },
  { id: '7', externalId: 'Error', color: 'hsl(42, 100%, 50%)' },
  { id: '17', externalId: 'LessThan1000', color: 'hsl(5, 100%, 88.4%)' },
  { id: '18', externalId: 'MoreThan1000', color: 'hsl(0, 100%, 42%)' },
]

const sortByInputArrayFlat = (data, sortExample) =>
  data.sort((a, b) => sortExample.indexOf(a) - sortExample.indexOf(b))

const sortByInputArray = (data, sortExample, sortKey) =>
  sortBy(data, item => sortExample.indexOf(item[sortKey]))

const getKeysFromResults = (data, keyToOmit, orderBy) => {
  // const newdata = data;
  // const filtered = newdata.filter(d => !includes(d, 'Color'));

  console.log(data)

  const res = sortByInputArrayFlat(
    uniq(data.flatMap(a => Object.keys(a))),
    orderBy
  )
  const dud = keyToOmit ? without(res, keyToOmit) : res

  // console.log(dud, includes(dud, 'Color'));

  return dud
}

const groupByKey = (data, key, cntKey, formatDate = false) => {
  return data.reduce((acc, curr) => {
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
    console.log(value)

    normalised.push({ ...value })
  }
  return normalised
}

const formatDataForPie = (
  data,
  key,
  value,
  orderBy = false,
  assayFromState
) => {
  const { resultCategories } = assayFromState

  return data.reduce((acc, curr) => {
    const newKey = resultCategories.filter(r => r.externalId === curr[key])[0]
    const label = (newKey && newKey.name) || curr[key]
    acc.push({ id: curr[key], label, value: curr[value] })
    return acc
  }, [])
}

const getAverageFromData = (data, value) => {
  const total = filter(data, ['id', data[0].id])
  const sum = data.reduce((acc, curr) => acc + curr.value, 0)
  return round((total[0][value] / sum) * 100)
}

const calcPercentageSplit = (data, keyToOmitDuringCalc) =>
  data.reduce((acc, curr, index) => {
    const dataPoints = omit(curr, keyToOmitDuringCalc)
    const total = sum(values(dataPoints))

    acc.push({
      [keyToOmitDuringCalc]: curr[keyToOmitDuringCalc],
    })

    for (const [key, value] of Object.entries(dataPoints)) {
      acc[index][key] = ((value / total) * 100).toFixed(2)
    }

    return acc
  }, [])

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
      // newItem[key] = value;
    }
    return translated.push({ ...newItem })
  })

  return translated
}

const setColors = data => {
  console.log(data)

  return data
}

export {
  calcPercentageSplit,
  formatDataForPie,
  getAverageFromData,
  getKeysFromResults,
  groupByKey,
  normaliseKeys,
  setColors,
  sortByInputArray,
  translateKeys,
}
