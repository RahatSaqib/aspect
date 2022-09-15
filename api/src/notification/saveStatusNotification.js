const { Boom } = require('@hapi/boom')
const { getUser } = require('../auth/service')
const { notificationTypeCreated } = require('../notificationType/actions')
const { saveNotificationType } = require('./common/db')

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

  if (result instanceof Boom.Boom) return result

  const { ok, notificationTypeId, error } = result
  if (!ok) {
    return Boom.internal(`Can not save notification: ${error}`)
  }
  if (!messageContext.notificationTypeCreated) messageContext.bindActionCreators({ notificationTypeCreated })
  messageContext.notificationTypeCreated(notificationTypeId)
  return { ok: true, notificationTypeId }
}
