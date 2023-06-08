const { getConstraints } = require('../auth/constraints')
const { getXdrDevicesSummary } = require('./common/db')

const xdrDevicesSummaryList = async ({ auth, query }) => {
  const dataConstraints = await getConstraints(auth.credentials)
  const { total, length, data } = await getXdrDevicesSummary(dataConstraints, query)

  return {
    ok: true,
    total,
    length,
    data,
  }
}

module.exports = {
  xdrDevicesSummaryList,
}
