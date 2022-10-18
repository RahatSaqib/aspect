const values = require('lodash/values')
const pick = require('lodash/pick')
const dashboardWidgetsBase = require('./dashboardWidgetsBase')

module.exports = {
  stat: values(
    pick(dashboardWidgetsBase.stat, [
      'sitesTitle',
      'devicesTitle',
      'resultsTitle',
      'personTitle',
      'geneXpertDevices',
      'gxPositiveResultsNotified',
      'dashboardWidgetTestsPerDayTitle',
      'dashboardWidgetValidResultsPc',
      'utilizationRate',
      'activeDevices',
      'activeDevicesCnt',
      'stockouts',
      'deviceDaysActive',
      'errorRate',
      'stockNotRecorded',
      'avgTimeToUpload',
      'moduleSwaps',
      'instrumentsReplaced',
      'percentageOfModulesFunctioning',
      'averageRecipientsOfEmail',
      'averageRecipientsOfSms',
      'averageLengthOfSms',
      'smsSent',
      'averageDaysModuleSwap',
      'averageTimeToModuleReplacement',
      'numberOfDevicesExperiencingServiceInterruption',
      'averageDurationServiceInterruption',
    ])
  ),
}
