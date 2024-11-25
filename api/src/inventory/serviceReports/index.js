const { getConstraints } = require('../../auth/constraints')
const { getUnreconciledInventoryReport } = require('./unreconciledInventoryReport')

async function unreconciledInventoryReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const dataSet = await getUnreconciledInventoryReport(dataConstraints, query)
  return dataSet
}

module.exports = {
  unreconciledInventoryReport,
}
