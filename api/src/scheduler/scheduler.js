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
const logger = require('../shared/logger')

/**
 * Staggers startup tasks with delays to prevent overwhelming the system during startup
 * @param {Object} dispatcher - The action dispatcher
 */
function staggerStartupTasks(dispatcher) {
  // Define startup tasks with their delay times (in milliseconds)
  // Using 10-second intervals instead of 5-second to provide more breathing room for system recovery
  const startupTasks = [
    { name: 'factGenerateResultCounts', delay: 0 },
    { name: 'factGenerateDeviceConnectivity', delay: 10000 }, // 10 seconds
    { name: 'factDataCategoryLowCheck', delay: 20000 }, // 20 seconds
    { name: 'factCalculateInventoryConsumptionRates', delay: 30000 }, // 30 seconds
    { name: 'factCheckCompletionRatePerSite', delay: 40000 }, // 40 seconds
    { name: 'factFillCustomFieldsCompletionStatsLast30Days', delay: 50000 }, // 50 seconds
    { name: 'resolveIssues', delay: 60000 }, // 60 seconds
    { name: 'calibrationDueDateAnalysis', delay: 70000 }, // 70 seconds
    { name: 'calibrationIssueNotificationTrigger', delay: 80000 }, // 80 seconds
    { name: 'resultAnalyzeTimeout', delay: 90000 }, // 90 seconds
    { name: 'missingInventoryLotsResolver', delay: 100000 }, // 100 seconds
    { name: 'deviceUpdateModuleSerials', delay: 110000 }, // 110 seconds
    { name: 'expectedBackOnlineAnalysis', delay: 120000 }, // 120 seconds (2 minutes)
  ]

  logger.info(
    'Scheduler startup: Staggering initial task execution over 2 minutes to improve system stability and recovery'
  )

  startupTasks.forEach(({ name, delay }) => {
    if (dispatcher[name]) {
      setTimeout(() => {
        logger.info(`Scheduler startup: Executing delayed startup task '${name}'`)
        dispatcher[name]()
      }, delay)

      if (delay > 0) {
        logger.info(`Scheduler startup: Task '${name}' scheduled to run in ${delay / 1000} seconds`)
      } else {
        logger.info(`Scheduler startup: Task '${name}' running immediately`)
      }
    }
  })
}

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

  // Stagger startup tasks instead of running them all immediately
  staggerStartupTasks(dispatcher)

  // cron.schedule('*/5 * * * *', dispatcher.webhookServerCheckTokens) // run every 5 minutes
  reportBasedCronStartUp(queue.createMessageContext('aspect_cron_reportBasedNotification'))
  cron.schedule('30 00 * * *', dispatcher.factFillCustomFieldsCompletionStatsLast30Days) // daily at 00:30 am
  cron.schedule('0 1 * * *', dispatcher.factCheckInventoryStock) // daily at 1 am
  cron.schedule('0 2 * * *', dispatcher.tryToContinueUnprocessedRawData) // daily at 2 am
  cron.schedule('0 3 * * *', dispatcher.factGenerateResultCounts) // daily at 3 am
  cron.schedule('10 * * * *', dispatcher.factGenerateDeviceConnectivity) // run every hour at 10 minutes past - AVOIDING minute 1 to prevent collisions with daily jobs
  cron.schedule('15 * * * *', dispatcher.factDataCategoryLowCheck) // every hour at 15th minute
  cron.schedule('30 * * * *', dispatcher.resultAnalyzeTimeout) // every hour at 30th minute
  cron.schedule('5-59/15 * * * *', dispatcher.escalateIssues) // run every 15 minutes at 5,20,35,50 minutes past - AVOIDING 00,15,30,45 to prevent collisions
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

  cron.schedule('25 3 * * *', dispatcher.deviceInactiveNotificationAnalysis) // daily at 3:25 am
  cron.schedule('30 6 * * *', dispatcher.expectedBackOnlineAnalysis) // daily at 6:30 am
  cron.schedule('40 */2 * * *', serviceModification) // run every 2 hours at 40 minutes past the hour
  cron.schedule('0 */1 * * *', unlinkAsyncReports) // run every 1 hour
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
