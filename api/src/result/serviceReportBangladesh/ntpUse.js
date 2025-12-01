const { reportDrTb10ABaseQuery } = require('.')
const { getDataForReportCovid19 } = require('.')
const { convertCsvToArrayOfNumbers } = require('../../shared/string')

// ---------------------------------------------------------------------------
async function getResultsForNtpUse(auth, query) {
  const { drTb10AData } = await reportDrTb10ABaseQuery(auth, query, true)
  const { data: dataForConvid19 } = await getDataForReportCovid19(auth, query, true)

  const resultData = await drTb10AData
  const data = transformData(resultData)

  const devicesBySite = buildDevicesBySiteMap(resultData)
  const finalData = mergeDataBySiteId(data, dataForConvid19, devicesBySite)

  return {
    ok: true,
    data: finalData,
  }
}

function buildDevicesBySiteMap(resultData) {
  const devicesBySite = new Map()
  resultData.forEach(({ deviceId, siteIds }) => {
    if (deviceId && siteIds) {
      const siteIdsArray = convertCsvToArrayOfNumbers(siteIds)
      siteIdsArray.forEach(siteId => {
        if (!devicesBySite.has(siteId)) {
          devicesBySite.set(siteId, new Set())
        }
        devicesBySite.get(siteId).add(deviceId)
      })
    }
  })
  return devicesBySite
}

function calculateCntDevicesForSiteIds(siteIds, devicesBySite) {
  if (!siteIds) {
    return 0
  }
  const siteIdsArray = convertCsvToArrayOfNumbers(siteIds)
  const uniqueDevices = new Set()
  siteIdsArray.forEach(siteId => {
    const devices = devicesBySite.get(siteId)
    if (devices) {
      devices.forEach(deviceId => uniqueDevices.add(deviceId))
    }
  })
  return uniqueDevices.size
}

function mergeDataBySiteId(arr1, arr2, devicesBySite) {
  const mergedData = new Map()

  const mergeIntoMap = data => {
    data.forEach(({ siteIds, ...rest }) => {
      if (!mergedData.has(siteIds)) {
        mergedData.set(siteIds, { siteIds })
      }
      mergedData.set(siteIds, { ...mergedData.get(siteIds), ...rest })
    })
  }

  mergeIntoMap(arr1)
  mergeIntoMap(arr2)

  const finalData = Array.from(mergedData.values())
  finalData.forEach(item => {
    item.cntDevices = calculateCntDevicesForSiteIds(item.siteIds, devicesBySite)
  })

  return finalData
}

function transformData(data) {
  const groupedData = {}

  data.forEach(({ siteIds, sampleType, ...rest }) => {
    if (!groupedData[siteIds]) {
      groupedData[siteIds] = {}
    }

    if (['Pulmonary', 'Extra-pulmonary'].includes(sampleType)) {
      groupedData[siteIds].main = { siteIds, sampleType, ...rest }
    } else if (sampleType === 'Stool') {
      const stoolEntry = Object.fromEntries(
        Object.entries(rest).map(([key, value]) => [key.startsWith('cnt_') ? `${key}_stool` : key, value])
      )
      groupedData[siteIds].stool = { siteIds, sampleType, ...stoolEntry }
    }
  })

  return Object.values(groupedData)
    .map(({ main, stool }) => ({
      ...(main || {}),
      ...(stool || {}),
    }))
    .filter(entry => Object.keys(entry).length > 0) // Ensure no empty objects
}

module.exports = {
  getResultsForNtpUse,
}
