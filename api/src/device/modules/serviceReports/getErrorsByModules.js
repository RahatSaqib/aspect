const { knex, filterParams } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')
const { getResultsWithinTimeFrame } = require('../db')

/**
 * Retrieves errors by modules based on the given data constraints and query parameters.
 *
 * @param {Object} dataConstraints - The data constraints to apply.
 * @param {Object} query - The query parameters.
 * @returns {Array} - An array of results with additional information about the total tests and errors per module.
 */
async function getErrorsByModules(dataConstraints, query) {
  const results = await getResultsWithinTimeFrame(knex, {
    addConstraints,
    dataConstraints,
    filterParams,
    query,
    timeFrame: 'day',
  })
  const totalByModuleSerial = new Map()
  results.forEach(result => {
    const { moduleSerial, errorCode, siteId } = result
    // Found few duplicate moduleSerial at multiple sites, so used siteId with module serial as key here.
    const key = `${siteId}-${moduleSerial}`
    if (totalByModuleSerial.has(key)) {
      const moduleSerialData = totalByModuleSerial.get(key)
      totalByModuleSerial.set(key, {
        totalTests: moduleSerialData.totalTests + 1,
        totalErrors: moduleSerialData.totalErrors + (errorCode ? 1 : 0),
      })
    } else {
      totalByModuleSerial.set(key, { totalTests: 1, totalErrors: errorCode ? 1 : 0 })
    }
  })

  return results
    .filter(result => result.errorCode)
    .map(result => {
      return {
        ...totalByModuleSerial.get(`${result.siteId}-${result.moduleSerial}`),
        ...result,
      }
    })
}

module.exports = {
  getErrorsByModules,
}
