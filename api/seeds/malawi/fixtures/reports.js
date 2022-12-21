const {
  mtbDetectedRRDetected: mtbDetectedRRDetectedBase,
  resultsHivNotSuppressed: resultsHivNotSuppressedBase,
} = require('../../fixtures/Report')

const mtbDetectedRRDetected = {
  ...mtbDetectedRRDetectedBase,
  sheets: [
    {
      ...mtbDetectedRRDetectedBase.sheets[0],
      moduleName: 'result/serviceReportMalawi',
      functionName: 'getResultsForReport',
    },
  ],
}

// ---------------------------------------------------------------
const resultsHivNotSuppressed = {
  ...resultsHivNotSuppressedBase,
  sheets: [
    {
      ...resultsHivNotSuppressedBase.sheets[0],
      moduleName: 'result/serviceReportMalawi',
      functionName: 'getResultsForReport',
    },
  ],
}

module.exports = {
  mtbDetectedRRDetected,
  resultsHivNotSuppressed,
}
