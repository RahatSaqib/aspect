const { subDays } = require('date-fns')
const { getConstraints } = require('../auth/constraints')
const { exportData } = require('../shared/excel')
const { getInventoryTransferForExport } = require('./common/db')
const { getBaseReplacements } = require('../shared/excel')
const { knex } = require('../db')
const { getOffsetFromUser } = require('../shared/date')

module.exports = async (request, reply) => {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)
  const offset = await getOffsetFromUser(knex, auth.credentials.name)
  const now = new Date()

  if (!query.minDate) {
    query.minDate = subDays(now, 30).toISOString()
  }
  if (!query.maxDate) {
    query.maxDate = now.toISOString()
  }

  const { data } = await getInventoryTransferForExport(query, dataConstraints, offset)

  // default to `xlsx`, notice that query validation allows only 'xlsx', 'csv', or empty/no param
  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'inventory_transfers', { replacements: getBaseReplacements() })
}
