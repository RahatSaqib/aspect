const { Boom } = require('@hapi/boom')
const { getUser } = require('../auth/service')
const { saveNotificationType } = require('./common/db')
const { notificationTypeCreated } = require('../notificationType/actions')

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

  if (result instanceof Boom.Boom) return result

  const { ok, notificationTypeId, error } = result
  if (!ok) {
    return Boom.internal(`Can not save notification: ${error}`)
  }
  if (!messageContext.notificationTypeCreated) messageContext.bindActionCreators({ notificationTypeCreated })
  messageContext.notificationTypeCreated(notificationTypeId)

  return { ok: true, notificationTypeId }
}
