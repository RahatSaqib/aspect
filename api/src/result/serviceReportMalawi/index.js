const { getOffsetFromIsoDateString } = require('../../shared/date')
const { getListResults } = require('../service')
const { getReportCommonFieldsTZ } = require('../query')

// ---------------------------------------------------------------
async function getResultsForReport(auth, query) {
  const userTimeOffset = getOffsetFromIsoDateString(query.maxDate)

  const fields = {
    ...getReportCommonFieldsTZ(userTimeOffset),
    /**
     * additional fields in Excel templates for Malawi
     */
    // "Date of sample collection" - <sampleCollectedOn>
    sampleCollectedOn: 'sp.collectedOn',
    // "Date of Receipt in the Lab" - <resultWorkflowLogCreatedOn>
    resultWorkflowLogCreatedOn: 'rsl.createdOn',
    // "Received by" - <resultWorkflowLogOperator>
    resultWorkflowLogOperator: 'rsl.operator',
  }

  // call same func as base report `MTB Detected RR Detected`
  return getListResults(query, auth, fields)
}

module.exports = {
  getResultsForReport,
}
