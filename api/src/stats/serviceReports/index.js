const getUsageStatsData = require('./usageStats/usageStats')
const { getUserActivityData } = require('./usageStats/getUserActivityData')
const getResultsBySiteData = require('./usageStats/resultsBySite')
const { getConstraints } = require('../../auth/constraints')

async function getUsageStats(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await getUsageStatsData(dataConstraints, query)

  return {
    ok: true,
    data,
  }
}

async function getUserActivity(auth, query, timezoneIANA) {
  const dataConstraints = await getConstraints(auth.credentials)

  const data = await getUserActivityData(dataConstraints, query, timezoneIANA)

  return {
    ok: true,
    data,
    total: data.length,
  }
}

async function getResultsBySite(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const data = await getResultsBySiteData(dataConstraints, query)

  return {
    ok: true,
    data,
    total: data.length,
  }
}

module.exports = { getUsageStats, getUserActivity, getResultsBySite }
