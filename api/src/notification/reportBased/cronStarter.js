const { reportReadyToDelivery } = require('../../report/actions')
const { getReporBasedNotifications } = require('../common/db')
const ReportBasedNotificationCacheSingleton = require('./reportBasedNotificationCache')

module.exports = async function (context) {
  const handler = notificationTypeId => {
    context.dispatch(reportReadyToDelivery(notificationTypeId))
  }
  const rbnList = await getReporBasedNotifications()

  rbnList.forEach(({ id, name, cronRecurrency }) => {
    const cache = ReportBasedNotificationCacheSingleton.getInstance()
    cache.addTask(id, name, cronRecurrency, handler)
  })
}
