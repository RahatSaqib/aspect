const { exportData, getBaseReplacements } = require('../shared/excel')
const { listDeviceApiKeys } = require('./listDeviceApiKeys')

function getSiteDevicePairs(deviceApiKey) {
  if ((deviceApiKey.devices || []).length > 0) {
    return deviceApiKey.devices.map(device => ({
      siteName: device.siteName,
      deviceName: device.name,
    }))
  }

  if ((deviceApiKey.sites || []).length > 0) {
    return deviceApiKey.sites.map(site => ({
      siteName: site.name,
      deviceName: '',
    }))
  }

  return [
    {
      siteName: deviceApiKey.site,
      deviceName: deviceApiKey.device,
    },
  ]
}

function formatSiteDevicePairs(deviceApiKey) {
  const displayPairs = getSiteDevicePairs(deviceApiKey)
    .map(({ siteName, deviceName }) => [siteName, deviceName].filter(Boolean).join(' / '))
    .filter(Boolean)

  return displayPairs.length > 0 ? displayPairs.join('\n') : '—'
}

async function exportDeviceApiKeys(request, reply) {
  const { query } = request

  query.page = 0
  query.size = 1e5

  const { data } = await listDeviceApiKeys(request)
  const sheetData = {
    data: data.map(deviceApiKey => ({
      ...deviceApiKey,
      siteDevicePairsDisplay: formatSiteDevicePairs(deviceApiKey),
    })),
    defaultNoDataMessage: 'No data',
  }

  return exportData(request, reply, sheetData, 'deviceApiKeys', {
    replacements: getBaseReplacements(),
  })
}

module.exports = {
  exportDeviceApiKeys,
}
