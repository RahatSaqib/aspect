const Promise = require('bluebird')
const { getConstraints } = require('../../auth/constraints')
const {
  getErrorTable,
  getGeneralStatsForMapping,
  addErrorTableSiteTotals,
} = require('./mtbStatsReport')

async function getMtbStats(auth, params) {
  const dataConstraints = await getConstraints(auth.credentials)

  const sections = await Promise.all([
    getErrorTable(dataConstraints, params),
    getGeneralStatsForMapping(dataConstraints, params),
  ])
  let errorTable = sections[0]
  const tbProgramStats = sections[1]

  const avgTestsPerModule =
    errorTable.length > 0 ? tbProgramStats.total / errorTable.length : 0
  errorTable = addErrorTableSiteTotals(errorTable)

  return {
    ok: true,
    data: {
      ...tbProgramStats,
      avgTestsPerModule,
      rows: errorTable,
    },
  }
}

module.exports = {
  getMtbStats,
}
