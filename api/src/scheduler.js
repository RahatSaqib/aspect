const _ = require('lodash')
const cron = require('node-cron')
const {
  factGenerateResultCounts,
  factGenerateDeviceConnectivity,
} = require('./fact/actions')
const { resultDataCategoryLowCheck } = require('../result/actions')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    factGenerateResultCounts,
    factGenerateDeviceConnectivity,
    resultDataCategoryLowCheck,
  })
  dispatcher.factGenerateResultCounts()
  dispatcher.factGenerateDeviceConnectivity()
  dispatcher.resultDataCategoryLow()

  cron.schedule('0 * * * *', dispatcher.factGenerateResultCounts)
  cron.schedule('1 * * * *', dispatcher.factGenerateDeviceConnectivity)
  cron.schedule('15 * * * *', dispatcher.resultDataCategoryLowCheck) // every hour at 15th minute
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
