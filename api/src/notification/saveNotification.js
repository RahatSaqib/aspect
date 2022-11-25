const { Boom, isBoom } = require('@hapi/boom')
const { getUser } = require('../auth/service')
const { saveNotificationType } = require('./common/db')
const { notificationTypeCreated } = require('../notificationType/actions')
const ReportBasedNotificationCacheSingleton = require('./reportBased/reportBasedNotificationCache')
const { reportDispatchHandler } = require('./reportBased/reportBasedCronHandler')

module.exports = async function (request) {
  const {
    auth,
    params,
    payload,
    plugins: { messageContext },
  } = request
  const { id } = params
  const user = await getUser(auth.credentials.name)
  const { partnerId, id: userId } = user

  const result = await saveNotificationType({
    id,
    partnerId,
    userId,
    payload,
  })
  if (isBoom(result)) return result

  const { ok, notificationTypeId, error } = result
  if (!ok) {
    return new Boom(`Can not save notification: ${error}`)
  }

  if (payload.notificationType === 'reportBased') {
    const cache = ReportBasedNotificationCacheSingleton.getInstance()
    const handler = reportDispatchHandler(messageContext, notificationTypeId)

    if (payload.enabled) {
      cache.createOrUpdateTask(notificationTypeId, payload.name, payload.cronRecurrency, handler)
    } else {
      cache.removeTask(notificationTypeId)
    }
  }
  if (!messageContext.notificationTypeCreated) messageContext.bindActionCreators({ notificationTypeCreated })
  messageContext.notificationTypeCreated(notificationTypeId)

  return { ok: true, notificationTypeId }
}
