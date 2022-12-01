const { notificationTypeCreated } = require('../notificationType/actions')
const { updateNotificationType, getNotificationStatusInfo } = require('./common/db')
const ReportBasedNotificationCacheSingleton = require('./reportBased/reportBasedNotificationCache')
const { reportDispatchHandler } = require('./reportBased/reportBasedCronHandler')

module.exports = async function (request) {
  const {
    params,
    plugins: { messageContext },
    payload,
  } = request

  const { id } = params

  await updateNotificationType(id, payload)

  await updateCronTask(id, messageContext, payload)

  if (!messageContext.notificationTypeCreated) {
    messageContext.bindActionCreators({ notificationTypeCreated })
  }
  messageContext.notificationTypeCreated(id)

  return { ok: true, notificationTypeId: id }
}

async function updateCronTask(id, messageContext, payload) {
  const { notificationType, name, cronRecurrency } = await getNotificationStatusInfo(id)

  if (notificationType === 'reportBased') {
    const cache = ReportBasedNotificationCacheSingleton.getInstance()
    const handler = reportDispatchHandler(messageContext, id)

    if (payload.enabled) {
      await cache.createOrUpdateTask(id, name, cronRecurrency, handler)
    } else {
      cache.removeTask(id)
    }
  }
}
