const _ = require('lodash')
const cron = require('node-cron')
const {
  factGenerateDeviceOffline,
  factGenerateResultCounts,
} = require('./fact/actions')
const { resultDataCategoryLowCheck } = require('../result/actions')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    factGenerateDeviceOffline,
    factGenerateResultCounts,
    resultDataCategoryLowCheck,
  })
  dispatcher.factGenerateDeviceOffline()
  dispatcher.factGenerateResultCounts()
  dispatcher.resultDataCategoryLow()

  cron.schedule('0 * * * *', dispatcher.factGenerateDeviceOffline)
  cron.schedule('1 * * * *', dispatcher.factGenerateResultCounts)
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
