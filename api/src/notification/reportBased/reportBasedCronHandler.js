const { reportReadyToDelivery } = require('../../report/actions')
const { getReporBasedNotifications } = require('../common/db')
const ReportBasedNotificationCacheSingleton = require('./reportBasedNotificationCache')

const reportDispatchHandler = (context, notificationTypeId) => {
  return () => {
    context.dispatch(reportReadyToDelivery(notificationTypeId))
  }
}

async function startUp(context) {
  const rbnList = await getReporBasedNotifications()

  rbnList.forEach(({ id, name, cronRecurrency }) => {
    const cache = ReportBasedNotificationCacheSingleton.getInstance()
    cache.createOrUpdateTask(id, name, cronRecurrency, reportDispatchHandler(context, id))
  })
}

module.exports = {
  startUp,
  reportDispatchHandler,
}
