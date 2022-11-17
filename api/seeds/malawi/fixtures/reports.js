const { mtbDetectedRRDetected: mtbDetectedRRDetectedBase } = require('../../fixtures/Report')

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

module.exports = {
  mtbDetectedRRDetected,
}
