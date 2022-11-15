const { getConstraints } = require('../auth/constraints')
const { getInventoryBySitesAndConsumable, getInventoryByLot } = require('./common/db')
const { splitCsvWithTrim } = require('../shared/string')
const { DAYS_STOCK_LEFT_RANGES } = require('../shared/constants')

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
  const range = DAYS_STOCK_LEFT_RANGES[query.daysStockLeft] || null
  return getInventoryBySitesAndConsumable(request, dataConstraints, range)
}
