const pick = require('lodash/pick')
const values = require('lodash/values')
const dashboardWidgetsBase = require('../../fixtures/dashboardWidgetsBase')

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
      'stockouts',
      'deviceDaysActive',
      'errorRate',
      'stockNotRecorded',
      'avgTimeToUpload',
      'moduleSwaps',
      'instrumentsReplaced',
      'unusedModules',
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
      'deviceCalibrationsWhenScheduled',
    ])
  ),
}
