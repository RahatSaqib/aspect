const { getConstraints } = require('../../auth/constraints')
const { getXpertSiteDetailedReport } = require('./xpertSiteDetailedReport')

async function xpertSiteDetailedReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { data, populator } = await getXpertSiteDetailedReport(dataConstraints, query)
  return {
    ok: true,
    data,
    populator,
  }
}

module.exports = {
  xpertSiteDetailedReport,
}
