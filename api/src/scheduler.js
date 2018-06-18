const _ = require('lodash')
const cron = require('node-cron')
const {
  factGenerateDeviceConnectivity,
  factGenerateResultCounts,
} = require('./fact/actions')
const { resultDataCategoryLowCheck } = require('../result/actions')
const { escalateIssues, resolveIssues } = require('./issue/actions')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    factGenerateResultCounts,
    factGenerateDeviceConnectivity,
    resultDataCategoryLowCheck,
    escalateIssues,
    resolveIssues,
  })
  dispatcher.factGenerateResultCounts()
  dispatcher.factGenerateDeviceConnectivity()
  dispatcher.resultDataCategoryLow()

  cron.schedule('0 * * * *', dispatcher.factGenerateResultCounts) // run every hour as it changes
  cron.schedule('1 * * * *', dispatcher.factGenerateDeviceConnectivity) // run every hour at 1 minute past the hour
  cron.schedule('15 * * * *', dispatcher.resultDataCategoryLowCheck) // every hour at 15th minute
  cron.schedule('*/15 * * * *', dispatcher.escalateIssues) // run every 15 minutes
  cron.schedule('30 7,22,37,52 * * * *', dispatcher.resolveIssues) // run every 15 minutes starting at 7m and 30s
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
