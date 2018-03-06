const cron = require('node-cron')
const { factGenerate } = require('./fact/actions')

function startScheduler(context) {
  context.bindActionCreators({ factGenerate })

  // run hourly tasks on startup and cron every hour
  runHourlyTasks(context)
  cron.schedule('0 * * * *', () => runHourlyTasks(context))
}

function runHourlyTasks(context) {
  context.factGenerate()
}

module.exports = {
  startScheduler,
}
