const { knex } = require('../../db')
const { getListResults } = require('../service')
const { getReportCommonFieldsTZ } = require('../query')

// ---------------------------------------------------------------
async function getResultsForReport(auth, query, timezoneIANA) {
  const fields = {
    ...getReportCommonFieldsTZ(timezoneIANA),
    /**
     * additional fields in Excel templates for Malawi
     */
    // "Date of sample collection" - <dateOfSampleCollection> - custom field "Date Sample Drawn"
    dateOfSampleCollection: knex.raw(`IFNULL(r.resultData->>'$.customFieldData."27".value', '')`),
    // "Date of Receipt in the Lab" - <dateOfReceiptInTheLab>
    dateOfReceiptInTheLab: knex.raw(`IFNULL(r.resultData->>'$.customFieldData."40".value', '')`),
    // "Received by" - <receivedBy>
    receivedBy: knex.raw(`IFNULL(r.resultData->>'$.customFieldData."41".value', '')`),
    // "ART Number" - <artNumber>
    artNumber: knex.raw(`IFNULL(r.resultData->>'$.customFieldData."42".value', '')`),
    // "District" - <district>
    district: knex.raw(`IFNULL(r.resultData->>'$.customFieldData."20".value', '')`),
  }

  // call same func as base report `MTB Detected RR Detected`
  return getListResults(query, auth, fields)
}

module.exports = {
  getResultsForReport,
}
