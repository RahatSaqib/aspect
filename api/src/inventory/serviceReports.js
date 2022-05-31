const { format } = require('date-fns')
const { listInventory, listLog } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')

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

  const scope = query.breakOutByLot
    ? 'supplies-by-lot'
    : 'supplies-by-site-and-consumable'

  return exportData(request, reply, sheetData, scope, {
    replacements: getBaseReplacements(),
  })
}

async function inventoryLog(auth, query) {
  const { data, total, ok } = await listLog({ auth, query })
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
