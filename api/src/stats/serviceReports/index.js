const getUsageStatsData = require('./usageStats')
const { getConstraints } = require('../../auth/constraints')

async function getUsageStats(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const rows = await getUsageStatsData(dataConstraints, query)

  return {
    ok: true,
    data: rows,
    total: rows.length,
  }
}

module.exports = { getUsageStats }
