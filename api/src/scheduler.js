const _ = require('lodash')
const cron = require('node-cron')
const {
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
  factCheckInventoryStock,
  factCalculateInventoryConsumptionRates,
  factDataCategoryLowCheck,
  factNewResultsAvailableCheck,
  factExternalSourceCheck,
} = require('./fact/actions')
const { escalateIssues, resolveIssues } = require('./issue/actions')
const config = require('./config')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    factGenerateResultCounts,
    factCheckInventoryStock,
    factGenerateDeviceConnectivity,
    factDataCategoryLowCheck,
    factCalculateInventoryConsumptionRates,
    factNewResultsAvailableCheck,
    factExternalSourceCheck,
    escalateIssues,
    resolveIssues,
  })
  dispatcher.factGenerateResultCounts()
  dispatcher.factGenerateDeviceConnectivity()
  dispatcher.factDataCategoryLowCheck()
  dispatcher.factCalculateInventoryConsumptionRates()

  cron.schedule('0 1 * * *', dispatcher.factCheckInventoryStock) // daily at 1 am
  cron.schedule('0 * * * *', dispatcher.factGenerateResultCounts) // run every hour as it changes
  cron.schedule('1 * * * *', dispatcher.factGenerateDeviceConnectivity) // run every hour at 1 minute past the hour
  cron.schedule('15 * * * *', dispatcher.factDataCategoryLowCheck) // every hour at 15th minute
  cron.schedule('*/15 * * * *', dispatcher.escalateIssues) // run every 15 minutes
  cron.schedule(
    '25 */2 * * *', // run every 2 hours at 25th minute past the hour
    dispatcher.factCalculateInventoryConsumptionRates
  )
  cron.schedule('30 7,22,37,52 * * * *', dispatcher.resolveIssues) // run every 15 minutes starting at 7m and 30s

  cron.schedule('0 7 * * *', dispatcher.factNewResultsAvailableCheck) // daily at 7am

  if (_.get(config, 'uptimerobot.api.key')) {
    const dispatchCheckUptimeRobot = () => {
      dispatchActionToQueue(
        queue,
        'aspect_scheduler_factExternalSourceCheck_uptimeRobot',
        factExternalSourceCheck({ sourceName: 'uptimeRobot' })
      )
    }
    //    cron.schedule('30 7,19 * * *', dispatchCheckUptimeRobot) // twice a day at 7:30am & 7:30pm
    cron.schedule('55 13,19 * * *', dispatchCheckUptimeRobot) // twice a day at 7:30am & 7:30pm
  }
}

function createActionDispatcher(queue, actionCreators) {
  const dispatcher = {}
  _.each(actionCreators, (creator, name) => {
    dispatcher[name] = () =>
      dispatchActionToQueue(queue, `aspect_scheduler_${name}`, creator())
  })
  return dispatcher
}

function dispatchActionToQueue(queue, queueId, action) {
  return queue.createMessageContext(queueId).dispatch(action)
}

module.exports = {
  startScheduler,
}
