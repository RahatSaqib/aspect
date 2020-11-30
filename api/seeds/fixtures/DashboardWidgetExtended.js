const dashboardWidgetsBase = require('./dashboardWidgetsBase')
const values = require('lodash/values')
const pick = require('lodash/pick')

module.exports = {
  stat: values(pick(dashboardWidgetsBase.stat, [
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
  ])),
}
