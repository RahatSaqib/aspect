const { subDays } = require('date-fns')
const { getConstraints } = require('../auth/constraints')
const { exportData } = require('../shared/excel')
const { getInventoryTransfer } = require('./common/db')
const { getBaseReplacements } = require('../shared/excel')
const { getUser } = require('../auth/service')

module.exports = async (request, reply) => {
  const { auth, query } = request

  const dataConstraints = await getConstraints(auth.credentials)
  const { timezoneIANA } = await getUser(auth.credentials.name)

  const now = new Date()

  if (!query.minDate) {
    query.minDate = subDays(now, 30).toISOString()
  }
  if (!query.maxDate) {
    query.maxDate = now.toISOString()
  }

  const { data } = await getInventoryTransfer(query, dataConstraints, timezoneIANA)

  // default to `xlsx`, notice that query validation allows only 'xlsx', 'csv', or empty/no param
  const sheetData = {
    data,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'inventory_transfers', { replacements: getBaseReplacements() })
}
