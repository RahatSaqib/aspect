const _ = require('lodash')
const cron = require('node-cron')
const {
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
  factCheckInventoryStock,
  factCalculateInventoryConsumptionRates,
} = require('./fact/actions')
const { escalateIssues } = require('./issue/actions')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    factGenerateResultCounts,
    factCheckInventoryStock,
    factGenerateDeviceConnectivity,
    factCalculateInventoryConsumptionRates,
    escalateIssues,
  })
  dispatcher.factGenerateResultCounts()
  dispatcher.factGenerateDeviceConnectivity()
  // dispatcher.factCalculateInventoryConsumptionRates()

  cron.schedule('0 1 * * *', dispatcher.factCheckInventoryStock) // daily at 1 am
  cron.schedule('0 * * * *', dispatcher.factGenerateResultCounts) // run every hour as it changes
  cron.schedule('1 * * * *', dispatcher.factGenerateDeviceConnectivity) // run every hour at 1 minute past the hour
  cron.schedule('*/15 * * * *', dispatcher.escalateIssues) // run every 15 minutes

  cron.schedule(
    '25 */2 * * *', // run every 2 hours at 25th minute past the hour
    dispatcher.factCalculateInventoryConsumptionRates
  )
}

function createActionDispatcher(queue, actionCreators) {
  const dispatcher = {}
  _.each(actionCreators, (creator, name) => {
    dispatcher[name] = () =>
      queue.createMessageContext(`aspect_scheduler_${name}`).dispatch(creator())
  })
  return dispatcher
}

module.exports = {
  startScheduler,
}
