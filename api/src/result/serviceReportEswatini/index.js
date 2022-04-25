const { getConstraints } = require('../../auth/constraints')
const {
  getErrorTable,
  getGeneralStatsForMapping,
  addErrorTableSiteTotals,
} = require('./mtbStatsReport')
const { getSmsStatsData, getResultStatsData } = require('./smsStatsReport')

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

async function getSmsStats(auth, params) {
  const dataConstraints = await getConstraints(auth.credentials)
  const smsStatsPromise = getSmsStatsData(dataConstraints, params)
  const resultStatsPromise = getResultStatsData(dataConstraints, params)

  const [smsStats, resultStats] = await Promise.all([
    smsStatsPromise,
    resultStatsPromise,
  ])

  return {
    ok: true,
    data: {
      ...smsStats,
      ...resultStats,
      rows: [],
    },
  }
}
module.exports = {
  getMtbStats,
  getSmsStats,
}
