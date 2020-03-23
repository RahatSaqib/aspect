import without from 'lodash/without'
import uniq from 'lodash/uniq'
import round from 'lodash/round'
import filter from 'lodash/filter'
import sortBy from 'lodash/sortBy'
import { format } from 'date-fns'

const sortByInputArrayFlat = (data, sortExample) =>
  data.sort((a, b) => sortExample.indexOf(a) - sortExample.indexOf(b))

const sortByInputArray = (data, sortExample, sortKey) =>
  sortBy(data, item => sortExample.indexOf(item[sortKey]))

const getKeysFromResults = (data, keyToOmit, orderBy) => {
  const res = sortByInputArrayFlat(
    uniq(data.flatMap(a => Object.keys(a))),
    orderBy
  )
  return keyToOmit ? without(res, keyToOmit) : res
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
    normalised.push({ ...value })
  }
  return normalised
}

const formatDataForPie = (data, key, value) => {
  return data.reduce((acc, curr) => {
    acc.push({ id: curr[key], label: curr[key], value: curr[value] })
    return acc
  }, [])
}

const getAverageFromData = (data, key, value) => {
  const total = filter(data, ['id', key])
  const sum = data.reduce((acc, curr) => acc + curr.value, 0)
  return round((total[0][value] / sum) * 100)
}

export {
  formatDataForPie,
  getAverageFromData,
  groupByKey,
  normaliseKeys,
  getKeysFromResults,
  sortByInputArray,
}
