const { format } = require('date-fns')
const { listInventory, listLog } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')
const { knex } = require('../db')
const { INVENTORY_LOG_LIST } = require('./common/queryConstants')
const { getOffsetFromIsoDateString, getDateTimeProjectionInUserTimeZone } = require('../shared/date')

async function exportSupplies(request, reply) {
  const { query } = request
  let { data } = await listInventory(request)

  if (query.breakOutByLot)
    data = data.map(item => ({
      ...item,
      expires: item.canExpire,
      expiresOn: format(new Date(item.expiresOn), 'yyyy-MM-dd'),
    }))

  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  const scope = query.breakOutByLot ? 'supplies-by-lot' : 'supplies-by-site-and-consumable'

  return exportData(request, reply, sheetData, scope, {
    replacements: getBaseReplacements(),
  })
}

async function inventoryLog(auth, query) {
  query.sortCol = 'createdOn'
  query.sortDir = 'asc'
  const { maxDate = new Date().toISOString() } = query
  const offset = getOffsetFromIsoDateString(maxDate)
  const { data, total, ok } = await listLog(
    { auth, query },
    {
      ...INVENTORY_LOG_LIST,
      createdOn: getDateTimeProjectionInUserTimeZone(knex, 'il.createdOn', offset),
    }
  )
  return {
    ok,
    total,
    data,
  }
}

module.exports = {
  exportSupplies,
  inventoryLog,
}
