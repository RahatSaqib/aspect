const { getConstraints } = require('../../auth/constraints')
const { getEidTestingWindowSummaryData } = require('./eidReport')

/**
 * Chad EID monthly report – sheet 2: summary of % tests within vs after 8 weeks, by facility.
 * Returns one row per reportable site with total EID tests and counts/percentages for the EID testing window.
 */
async function getEidTestingWindowSummaryReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const result = await getEidTestingWindowSummaryData(dataConstraints, query)

  if (!result) {
    return {
      ok: false,
      errorMessage: 'GxHiv1Qual assay not found',
    }
  }

  const { data, dynamicColumns } = result

  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    dynamicColumns,
    defaultNoDataMessage: 'No data',
  }
}

module.exports = {
  getEidTestingWindowSummaryReport,
}
