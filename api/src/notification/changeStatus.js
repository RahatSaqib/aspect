const { notificationTypeCreated } = require('../notificationType/actions')
const { update } = require('./common/db')

module.exports = async function (request) {
  const {
    params,
    plugins: { messageContext },
    payload,
  } = request
  const { id } = params

  await update(id, payload)

  if (!messageContext.notificationTypeCreated) messageContext.bindActionCreators({ notificationTypeCreated })
  messageContext.notificationTypeCreated(id)

  return { ok: true, notificationTypeId: id }
}
