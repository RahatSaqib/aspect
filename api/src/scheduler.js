const _ = require('lodash')
const cron = require('node-cron')
const {
  factGenerateDeviceOffline,
  factGenerateResultCounts,
} = require('./fact/actions')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    factGenerateDeviceOffline,
    factGenerateResultCounts,
  })
  dispatcher.factGenerateDeviceOffline()
  dispatcher.factGenerateResultCounts()

  cron.schedule('0 * * * *', dispatcher.factGenerateDeviceOffline)
  cron.schedule('1 * * * *', dispatcher.factGenerateResultCounts)
}

function createActionDispatcher(queue, actionCreators) {
  const dispatcher = {}
  _.each(actionCreators, (creator, name) => {
    dispatcher[name] = () => queue.createMessageContext().dispatch(creator())
  })
  return dispatcher
}

module.exports = {
  startScheduler,
}
