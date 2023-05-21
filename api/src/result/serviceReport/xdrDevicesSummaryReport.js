const { getConstraints } = require('../../auth/constraints')
const { getXdrDevicesSummary } = require('../common/db')

module.exports = async (auth, query) => {
  const dataConstraints = await getConstraints(auth.credentials)
  const data = await getXdrDevicesSummary(dataConstraints, query)

  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
}
