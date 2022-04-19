const { getConstraints } = require('../../auth/constraints')
const { getSmsStatsData } = require('./smsStatsReport')
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

async function getSmsStats(auth, params) {
  const dataConstraints = await getConstraints(auth.credentials)

  const stats = await getSmsStatsData(dataConstraints, params)

  return {
    ok: true,
    data: {
      ...stats,
      rows: [],
    },
  }
}
module.exports = {
  getMtbStats,
  getSmsStats,
}
