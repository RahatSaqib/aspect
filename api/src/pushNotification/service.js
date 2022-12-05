const { pushNotificationMessageReadyForSending, pushNotificationMessageSent } = require('./actions')
const { allMessageStatusToId, messageStatusToId } = require('../shared/dictionary')
const { addDataSourceToQuery, processUsingDataSourceQuery } = require('../stringTemplate/service')
const { getConstraints } = require('../auth/constraints')

// -----------------------------
// onPushNotificationMessageCreated - event handler for action PUSH_NOTIFICATION_MESSAGE_CREATED
// -----------------------------
async function onPushNotificationMessageCreated({ pushNotificationMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    pushNotificationMessageReadyForSending,
  })

  return context.transact(async knex => {
    // after push notification message entry created - process it's template and merge it with data
    await preparePushNotificationMessageForSending(context, knex, pushNotificationMessageId)
  })
}

// -----------------------------
// preparePushNotificationMessageForSending
// -----------------------------
async function preparePushNotificationMessageForSending(context, knex, pushNotificationMessageId) {
  const { title, body, data } = await createPushNotificationMessageFromTemplate(knex, pushNotificationMessageId)
  const messageStatusId = await messageStatusToId('Pending')

  // store generated push notification message into the same record and set messageStatusId
  await knex('PushNotificationMessage').where({ id: pushNotificationMessageId }).update({
    title,
    body,
    data,
    messageStatusId,
    updatedOn: new Date(),
  })

  // dispatch PUSH_NOTIFICATION_MESSAGE_READY_FOR_SENDING to MQ
  context.pushNotificationMessageReadyForSending(pushNotificationMessageId)
}

// -----------------------------
// onPushNotificationMessageReadyForSending - event handler for PUSH_NOTIFICATION_MESSAGE_READY_FOR_SENDING
// -----------------------------
async function onPushNotificationMessageReadyForSending({ pushNotificationMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    pushNotificationMessageSent,
  })

  return context.transact(async knex => {
    await doSendPushNotificationMessage(context, knex, pushNotificationMessageId)
  })
}

// -----------------------------
// doSendPushNotificationMessage
// -----------------------------
async function doSendPushNotificationMessage(context, knex, pushNotificationMessageId) {
  // get message
  const d = await knex('PushNotificationMessage as sm')
    .leftJoin('Person as p', 'sm.personId', 'p.id')
    .leftJoin('User as u', 'p.userId', 'u.id')
    .leftJoin('RefreshToken as t', 'u.id', 't.userId')
    .where('sm.id', pushNotificationMessageId)
    .whereNotNull('t.deviceTokenId')
    .first('t.deviceTokenId', 'sm.title', 'sm.body', 'sm.data')

  const { deviceTokenId, title, body, data } = d || {}

  // push notification handler
  const { sendPushNotification } = require('./pushNotificationUtil')

  // assume status is 'Sent'
  const { Sent: messageStatusIdSent, Error: messageStatusIdError } = await allMessageStatusToId()
  let messageStatusId = messageStatusIdSent

  // send push notification
  await sendPushNotification(deviceTokenId, title, body, data).catch(() => {
    // set status to 'Error'
    messageStatusId = messageStatusIdError
  })

  // store status in db
  await knex('PushNotificationMessage').where({ id: pushNotificationMessageId }).update({
    messageStatusId,
    updatedOn: new Date(),
  })

  // dispatch PUSH_NOTIFICATION_MESSAGE_SENT to MQ
  context.pushNotificationMessageSent(pushNotificationMessageId)
}

async function createPushNotificationMessageFromTemplate(knex, pushNotificationMessageId) {
  const { personId, resultId, reportId } = await knex('PushNotificationMessage as p')
    .leftJoin('Notification as n', 'n.pushNotificationMessageId', 'p.id')
    .where('p.id', pushNotificationMessageId)
    .first('p.personId', 'p.resultId', 'n.reportId')

  const dataConstraints = await getConstraints({ personId })

  const data = await knex('PushNotificationMessage as m')
    .innerJoin('PushNotificationTemplate as tmpl', 'm.pushNotificationTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.pushNotificationMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' }, dataConstraints, resultId, reportId)
    .where({ 'm.id': pushNotificationMessageId })
    .first('tmpl.title as titleTemplate', 'tmpl.body as bodyTemplate', 'tmpl.data as dataTemplate')
  return processUsingDataSourceQuery(data, ['titleTemplate', 'bodyTemplate', 'dataTemplate'])
}

module.exports = {
  onPushNotificationMessageCreated,
  onPushNotificationMessageReadyForSending,
}
