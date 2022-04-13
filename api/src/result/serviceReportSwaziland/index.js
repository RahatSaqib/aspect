const { getConstraints } = require('../../auth/constraints')
const {
  getErrorTable,
  getGeneralStatsForMapping,
  addErrorTableSiteTotals,
} = require('./mtbStatsReport')

async function getMtbStats(auth, params) {
  const dataConstraints = await getConstraints(auth.credentials)

  let errorTable = await getErrorTable(dataConstraints, params)
  const tbProgramStats = await getGeneralStatsForMapping(
    dataConstraints,
    params
  )
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
