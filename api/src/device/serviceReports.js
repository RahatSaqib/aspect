const _ = require('lodash')
const { format } = require('date-fns')
const { listDevices } = require('./service')
const { exportData, getBaseReplacements } = require('../shared/excel')
const { issueCategoryIntlToShortname } = require('../shared/dictionary')

async function exportDevices(request, reply) {
  const { data } = await listDevices(request)
  const [devicesData] = data
  const scope = devicesData.category !== 'Router' ? 'devices' : 'routers'

  const issueCategories = await issueCategoryIntlToShortname()
  // calculated and normalized props
  const dataRows =
    scope === 'devices'
      ? data.map(item => ({
          ...item,
          issuesCategories: _.map(
            item.issueCategories,
            ({ key }) => issueCategories[key]
          ).join(', '),
          availabilityRate: item.availability.rate, // Excel column formatted as 'Percentage'
          errorRate: item.error.rate, // Excel column formatted as 'Percentage'
        }))
      : data.map(item => ({
          ...item,
          lastPingOn: format(new Date(item.lastPingOn), 'yyyy-MM-dd'),
          lastSeen: format(new Date(item.lastSeen), 'yyyy-MM-dd HH:mm:ss'),
        }))
  //
  const sheetData = {
    dataRows,
    // TODO: use i18n string, because `exportData()` uses locale file templates with all labels translated
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, scope, {
    replacements: getBaseReplacements(),
  })
}
module.exports = {
  exportDevices,
}
