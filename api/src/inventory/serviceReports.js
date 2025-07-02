const { format } = require('date-fns')
const { exportData, getBaseReplacements } = require('../shared/excel')
const listInventoryLog = require('./listInventoryLog')
const listInventory = require('./listInventory')
const { listReconciliation } = require('./listReconciliation')
const { getConstraints } = require('../auth/constraints')
const { getUnreconciledInventoryReport } = require('./unreconciledInventoryReport')

async function unreconciledInventoryReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const dataSet = await getUnreconciledInventoryReport(dataConstraints, query)
  return dataSet
}

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
  const { data, total, ok } = await listInventoryLog({ auth, query })
  return {
    ok,
    total,
    data,
  }
}

async function exportReconciliation(request, replay) {
  const { query } = request
  const { data } = await listReconciliation(request)
  const sheetData = { data, defaultNoDataMessage: 'No data' }
  const scope = query.breakOutByLot ? 'reconciliation-by-lot' : 'reconciliation'

  return exportData(request, replay, sheetData, scope, { replacements: getBaseReplacements() })
}

module.exports = {
  exportSupplies,
  exportReconciliation,
  inventoryLog,
  unreconciledInventoryReport,
}
