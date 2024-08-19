const _ = require('lodash')
const { knex, filterParams } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')
const { getResultsWithinTimeFrame } = require('../db')

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
    const { moduleSerial, errorCode } = result
    if (totalByModuleSerial.has(moduleSerial)) {
      const moduleSerialData = totalByModuleSerial.get(moduleSerial)
      totalByModuleSerial.set(moduleSerial, {
        totalTests: moduleSerialData.totalTests + 1,
        totalErrors: moduleSerialData.totalErrors + (errorCode ? 1 : 0),
      })
    } else {
      totalByModuleSerial.set(moduleSerial, { totalTests: 1, totalErrors: errorCode ? 1 : 0 })
    }
  })

  return results
    .filter(result => result.errorCode)
    .map(result => {
      return {
        ...totalByModuleSerial.get(result.moduleSerial),
        ...result,
      }
    })
}

module.exports = {
  getErrorsByModules,
}
