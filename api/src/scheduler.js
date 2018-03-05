const cron = require('node-cron')
const { factGenerate } = require('./fact/actions')

function startScheduler(queue) {
  // run hourly tasks on startup and cron every hour
  runHourlyTasks(queue)
  cron.schedule('0 * * * *', () => runHourlyTasks(queue))
}

function runHourlyTasks(queue) {
  const context = queue.createMessageContext({ factGenerate })
  context.factGenerate()
}

module.exports = {
  startScheduler,
}
