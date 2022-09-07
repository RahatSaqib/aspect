const { getConstraints } = require('../auth/constraints')
const { getInventoryBySitesAndConsumable, getInventoryByLot } = require('./common/db')
const { splitCsvWithTrim } = require('../shared/string')

module.exports = async function (request) {
  const { auth, query } = request
  const { breakOutByLot } = query

  const dataConstraints = await getConstraints(auth.credentials)

  let data
  let total

  if (breakOutByLot) {
    ;({ total, data } = await listInventoryByLot(request, dataConstraints))
  } else {
    ;({ total, data } = await listInventoryBySiteAndConsumable(request, dataConstraints))
  }
  return { ok: true, total, length: data.length, data }
}

async function listInventoryByLot(request, dataConstraints) {
  const requestQuery = request.query
  if (requestQuery.sortCol) {
    let sortCols = splitCsvWithTrim(requestQuery.sortCol)
    if (!sortCols.includes('siteName')) {
      sortCols = [...sortCols, 'siteName']
    }
    if (!sortCols.includes('consumableName')) {
      sortCols = [...sortCols, 'consumableName']
    }
    requestQuery.sortCol = sortCols.join(',')
  }
  return getInventoryByLot(request, requestQuery, dataConstraints)
}

async function listInventoryBySiteAndConsumable(request, dataConstraints) {
  const { query } = request
  const range = getDaysStockLeftRanges(query.daysStockLeft)
  return getInventoryBySitesAndConsumable(request, dataConstraints, range)
}

function getDaysStockLeftRanges(key) {
  switch (key) {
    case 'outOfStock':
      return { min: 0, max: 0 }
    case 'upTo14':
      return { min: 1, max: 14 }
    case 'upTo30':
      return { min: 15, max: 30 }
    case 'upTo90':
      return { min: 31, max: 90 }
    case 'upTo180':
      return { min: 91, max: 180 }
    case 'moreThan180':
      return { min: 181 }
    default:
      return null
  }
}
