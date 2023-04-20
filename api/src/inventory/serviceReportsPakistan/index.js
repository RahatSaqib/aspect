const { getConstraints } = require('../../auth/constraints')
const { getMissingCartridgesReport } = require('./missingCartridgesReport')

async function missingCartridgesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const dataSet = await getMissingCartridgesReport(dataConstraints, query)
  return dataSet
}

module.exports = {
  missingCartridgesReport,
}
