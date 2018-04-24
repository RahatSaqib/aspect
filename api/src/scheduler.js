const _ = require('lodash')
const cron = require('node-cron')
const { factGenerate, factGenerateResultCounts } = require('./fact/actions')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  const dispatcher = createActionDispatcher(queue, {
    factGenerate,
    factGenerateResultCounts,
  })
  dispatcher.factGenerate()
  // dispatcher.factGenerateResultCounts()

  cron.schedule('0 * * * *', dispatcher.factGenerate)
  cron.schedule('1 * * * *', dispatcher.factGenerateResultCounts)
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
