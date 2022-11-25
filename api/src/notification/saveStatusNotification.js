const { Boom, isBoom } = require('@hapi/boom')
const { getUser } = require('../auth/service')
const { notificationTypeCreated } = require('../notificationType/actions')
const { saveNotificationType, getNotificationStatusInfo } = require('./common/db')
const { reportDispatchHandler } = require('./reportBased/reportBasedCronHandler')
const ReportBasedNotificationCacheSingleton = require('./reportBased/reportBasedNotificationCache')

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

  const result = await saveNotificationType({
    id,
    partnerId,
    userId,
    payload,
  })

  if (isBoom(result)) return result

  const { ok, notificationTypeId, error } = result
  if (!ok) {
    return Boom.internal(`Can not save notification: ${error}`)
  }

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

  if (!messageContext.notificationTypeCreated) messageContext.bindActionCreators({ notificationTypeCreated })
  messageContext.notificationTypeCreated(notificationTypeId)
  return { ok: true, notificationTypeId }
}
