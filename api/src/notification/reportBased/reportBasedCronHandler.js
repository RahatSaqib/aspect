const { reportBasedNotificationRequested } = require('../../report/actions')
const { getReporBasedNotifications } = require('../common/db')
const ReportBasedNotificationCacheSingleton = require('./reportBasedNotificationCache')

const reportDispatchHandler = (context, notificationTypeId) => {
  return () => {
    context.dispatch(reportBasedNotificationRequested(notificationTypeId))
  }
}

async function startUp(context) {
  const rbnList = await getReporBasedNotifications()

  await rbnList.forEach(async ({ id, name, cronRecurrency }) => {
    const cache = ReportBasedNotificationCacheSingleton.getInstance()
    await cache.createOrUpdateTask(id, name, cronRecurrency, reportDispatchHandler(context, id))
  })
}

module.exports = {
  startUp,
  reportDispatchHandler,
}
