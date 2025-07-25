const cron = require('node-cron')
const { startUp: reportBasedCronStartUp } = require('../notification/reportBased/reportBasedCronHandler')
const { resultAnalyzeTimeout, deviceInactiveNotificationAnalysis } = require('../notification/actions')
const { missingInventoryLotsResolver } = require('../inventory/actions')
const {
  calibrationDueDateAnalysis,
  calibrationIssueNotificationTrigger,
  deviceUpdateModuleSerials,
  expectedBackOnlineAnalysis,
} = require('../device/actions')
const {
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
  factCheckInventoryStock,
  factCalculateInventoryConsumptionRates,
  factDataCategoryLowCheck,
  factNewResultsAvailableCheck,
  factFillCustomFieldsCompletionStatsLast30Days,
  factCheckCompletionRatePerSite,
} = require('../fact/actions')
const { escalateIssues, resolveIssues } = require('../issue/actions')
const { logDeviceMaintenanceStatus } = require('../device/actions')
const { tryToContinueUnprocessedRawData } = require('../deviceApiRaw/actions')
const { webhookServerCheckTokens } = require('../webhook/actions')
const { serviceModification, serviceNotificationInformation } = require('../auth/service')
const config = require('../config')
const { unlinkAsyncReports } = require('../report/service')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    calibrationDueDateAnalysis,
    calibrationIssueNotificationTrigger,
    escalateIssues,
    factGenerateResultCounts,
    factCheckInventoryStock,
    factGenerateDeviceConnectivity,
    factDataCategoryLowCheck,
    factCalculateInventoryConsumptionRates,
    factNewResultsAvailableCheck,
    factFillCustomFieldsCompletionStatsLast30Days,
    factCheckCompletionRatePerSite,
    logDeviceMaintenanceStatus,
    resolveIssues,
    tryToContinueUnprocessedRawData,
    resultAnalyzeTimeout,
    missingInventoryLotsResolver,
    deviceUpdateModuleSerials,
    webhookServerCheckTokens,
    deviceInactiveNotificationAnalysis,
    expectedBackOnlineAnalysis,
  })

  // dispatcher.webhookServerCheckTokens()
  dispatcher.factGenerateResultCounts()
  dispatcher.factGenerateDeviceConnectivity()
  dispatcher.factDataCategoryLowCheck()
  dispatcher.factCalculateInventoryConsumptionRates()
  dispatcher.factCheckCompletionRatePerSite()
  dispatcher.factFillCustomFieldsCompletionStatsLast30Days()
  dispatcher.resolveIssues()
  dispatcher.calibrationDueDateAnalysis()
  dispatcher.calibrationIssueNotificationTrigger()
  dispatcher.resultAnalyzeTimeout()
  dispatcher.missingInventoryLotsResolver()
  dispatcher.deviceUpdateModuleSerials()
  dispatcher.expectedBackOnlineAnalysis()

  // cron.schedule('*/5 * * * *', dispatcher.webhookServerCheckTokens) // run every 5 minutes
  reportBasedCronStartUp(queue.createMessageContext('aspect_cron_reportBasedNotification'))
  cron.schedule('30 00 * * *', dispatcher.factFillCustomFieldsCompletionStatsLast30Days) // daily at 00:30 am
  cron.schedule('0 1 * * *', dispatcher.factCheckInventoryStock) // daily at 1 am
  cron.schedule('0 2 * * *', dispatcher.tryToContinueUnprocessedRawData) // daily at 2 am
  cron.schedule('0 4 * * *', dispatcher.factGenerateResultCounts) // daily at 4 am - MOVED to avoid collisions with hourly jobs
  cron.schedule('10 * * * *', dispatcher.factGenerateDeviceConnectivity) // run every hour at 10 minutes past - AVOIDING minute 1 to prevent collisions with daily jobs
  cron.schedule('15 * * * *', dispatcher.factDataCategoryLowCheck) // every hour at 15th minute
  cron.schedule('30 * * * *', dispatcher.resultAnalyzeTimeout) // every hour at 30th minute
  cron.schedule('5,20,35,50 * * * *', dispatcher.escalateIssues) // run every 15 minutes at 5,20,35,50 minutes past - AVOIDING 00,15,30,45 to prevent collisions
  cron.schedule(
    '45 */2 * * *', // run every 2 hours at 45th minute past the hour - MOVED from 25 to avoid collisions
    dispatcher.factCalculateInventoryConsumptionRates
  )
  cron.schedule('30 2 * * *', dispatcher.calibrationDueDateAnalysis) // daily at 2:30 am
  cron.schedule('0 8 * * *', dispatcher.calibrationIssueNotificationTrigger) // daily at 08:00 am

  cron.schedule('30 7,22,37,52 * * * *', dispatcher.resolveIssues) // run every 15 minutes starting at 7m and 30s

  cron.schedule('0 7 * * *', dispatcher.factNewResultsAvailableCheck) // daily at 7am

  cron.schedule('15 2 * * *', dispatcher.missingInventoryLotsResolver) // daily at 02:15 am - MOVED from 02:00 to avoid conflict

  cron.schedule('0 */8 * * *', dispatcher.deviceUpdateModuleSerials) // run every 8 hours

  cron.schedule('15 4 * * *', dispatcher.deviceInactiveNotificationAnalysis) // daily at 4:15 am - MOVED to avoid conflict with factGenerateResultCounts
  cron.schedule('30 6 * * *', dispatcher.expectedBackOnlineAnalysis) // daily at 6:30 am
  cron.schedule('0 */2 * * *', serviceModification) // run every 2 hours
  cron.schedule('* */1 * * *', unlinkAsyncReports) // run every 1 hour
  cron.schedule('0 0 * * *', serviceNotificationInformation) // run in every 24 hrs

  cron.schedule(config.scheduler.cron.logDeviceMaintenanceStatus, dispatcher.logDeviceMaintenanceStatus) // Determined by scheduler.cron.logDeviceMaintenanceStatus in .env but defaults to daily at 6pm

  return dispatcher
}

function createActionDispatcher(queue, actionCreators) {
  const dispatcher = {}
  for (const [name, creator] of Object.entries(actionCreators)) {
    dispatcher[name] = () => dispatchActionToQueue(queue, `aspect_scheduler_${name}`, creator())
  }
  return dispatcher
}

function dispatchActionToQueue(queue, queueId, action) {
  return queue.createMessageContext(queueId).dispatch(action)
}

module.exports = {
  startScheduler,
}
