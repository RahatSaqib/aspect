const { getConstraints } = require('../auth/constraints')
const { exportData } = require('../shared/excel')
const { getInventoryTransfer } = require('./common/db')
const { getBaseReplacements } = require('../shared/excel')

module.exports = async (request, reply) => {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const { data } = await getInventoryTransfer(query, dataConstraints)

  // default to `xlsx`, notice that query validation allows only 'xlsx', 'csv', or empty/no param
  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'inventory_transfers', { replacements: getBaseReplacements() })
}
