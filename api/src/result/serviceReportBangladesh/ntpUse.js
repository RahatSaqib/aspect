const { reportDrTb10ABaseQuery } = require('.')
const { getDataForReportCovid19 } = require('.')

// ---------------------------------------------------------------------------
async function getResultsForNtpUse(auth, query) {
  const { drTb10AData } = await reportDrTb10ABaseQuery(auth, query, true)
  const { data: dataForConvid19 } = await getDataForReportCovid19(auth, query, true)

  const resultData = await drTb10AData
  const data = transformData(resultData)

  const finalData = mergeDataBySiteId(data, dataForConvid19)

  return {
    ok: true,
    data: finalData,
  }
}

function mergeDataBySiteId(arr1, arr2) {
  const mergedData = new Map()

  // Helper function to merge data into the map
  const mergeIntoMap = data => {
    data.forEach(({ siteIds, ...rest }) => {
      if (!mergedData.has(siteIds)) {
        mergedData.set(siteIds, { siteIds })
      }
      // Merge new data into the existing object without mutating the original
      mergedData.set(siteIds, { ...mergedData.get(siteIds), ...rest })
    })
  }

  // Merge both arrays into the map
  mergeIntoMap(arr1)
  mergeIntoMap(arr2)

  return Array.from(mergedData.values())
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
