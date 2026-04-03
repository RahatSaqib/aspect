const pick = require('lodash/pick')
const values = require('lodash/values')
const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsCommon')

module.exports = {
  stat: values(
    pick(dashboardWidgetsBase.stat, [
      'sitesTitle',
      'devicesTitle',
      'resultsTitle',
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
      'percentageOfModulesFunctioning',
      'averageRecipientsOfEmail',
      'averageRecipientsOfSms',
      'averageLengthOfSms',
      'smsSent',
      'averageDaysModuleSwap',
      'averageTimeToModuleReplacement',
      'numberOfDevicesExperiencingServiceInterruption',
      'averageDurationServiceInterruption',
      'percentageOfDaysWithServiceInterruption',
      'serverUptimeTitle',
      'deviceCalibrationPastDue',
      'deviceCalibratedWhenDue',
      'totalNumberOfModules',
      'activeModules',
    ])
  ),
}
