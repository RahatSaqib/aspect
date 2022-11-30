const { notificationTypeCreated } = require('../notificationType/actions')
const { updateNotificationType } = require('./common/db')


async function updateCronTask(id, messageContext, payload) {
  const { notificationType, name, cronRecurrency } = await getNotificationStatusInfo(id)

  if (notificationType === 'reportBased') {
    const cache = ReportBasedNotificationCacheSingleton.getInstance()
    const handler = reportDispatchHandler(messageContext, id)

    if (payload.enabled) {
      cache.createOrUpdateTask(notificationTypeId, name, cronRecurrency, handler)
    } else {
      cache.removeTask(id)
    }
  }
}

module.exports = async function (request) {
  const {
    auth,
    params,
    plugins: { messageContext },
    payload,
  } = request

  const { id } = params
  const user = await getUser(auth.credentials.name)
  const { partnerId, id: userId } = user

  await updateNotificationType(id, payload)

  await updateCronTask(id, messageContext, payload)

  if (!messageContext.notificationTypeCreated) {
    messageContext.bindActionCreators({ notificationTypeCreated })
  }
  messageContext.notificationTypeCreated(id)

  return { ok: true, notificationTypeId: id }
}