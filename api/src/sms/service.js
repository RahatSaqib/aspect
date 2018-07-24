const { smsMessageReadyForSending, smsMessageSent } = require('./actions')
const {
  allMessageStatusToId,
  messageStatusToId,
} = require('../shared/dictionary')
const {
  addDataSourceToQuery,
  processUsingDataSourceQuery,
} = require('../stringTemplate/service')

// -----------------------------
// onSmsMessageCreated - event handler for action SMS_MESSAGE_CREATED
// -----------------------------
function onSmsMessageCreated({ smsMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    smsMessageReadyForSending,
  })

  return context.transact(async knex => {
    // after sms message entry created - process it's template and merge it with data
    await prepareSmsMessageForSending(context, knex, smsMessageId)
  })
}

// -----------------------------
// prepareSmsMessageForSending
// -----------------------------
async function prepareSmsMessageForSending(context, knex, smsMessageId) {
  const { message, phoneNumber } = await createSmsMessageFromTemplate(
    knex,
    smsMessageId
  )
  const messageStatusId = await messageStatusToId('Pending')

  // store generated sms message into the same record and set messageStatusId
  await knex('SmsMessage')
    .where({ id: smsMessageId })
    .update({
      message,
      phoneNumber,
      messageStatusId,
      updatedOn: new Date(),
    })

  // dispatch SMS_MESSAGE_READY_FOR_SENDING to MQ
  context.smsMessageReadyForSending(smsMessageId)
}

// -----------------------------
// onSmsMessageReadyForSending - event handler for SMS_MESSAGE_READY_FOR_SENDING
// -----------------------------
function onSmsMessageReadyForSending({ smsMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    smsMessageSent,
  })

  return context.transact(async knex => {
    await doSendSmsMessage(context, knex, smsMessageId)
  })
}

// -----------------------------
// doSendSmsMessage
// -----------------------------
async function doSendSmsMessage(context, knex, smsMessageId) {
  // get message and cell phone
  const d = await knex('SmsMessage as sm')
    .where({ 'sm.id': smsMessageId })
    .first('sm.message', 'sm.phoneNumber as cell')

  const { cell, message } = d || {}

  // sms handler
  const { sendSms } = require('./smsUtil')

  // assume status is 'Sent'
  const {
    Sent: messageStatusIdSent,
    Error: messageStatusIdError,
  } = await allMessageStatusToId()
  let messageStatusId = messageStatusIdSent

  // send sms
  await sendSms(cell, message).catch(() => {
    // set status to 'Error'
    messageStatusId = messageStatusIdError
  })

  // store status in db
  await knex('SmsMessage')
    .where({ id: smsMessageId })
    .update({
      messageStatusId,
      updatedOn: new Date(),
    })

  // dispatch SMS_MESSAGE_SENT to MQ
  context.smsMessageSent(smsMessageId)
}

async function createSmsMessageFromTemplate(knex, smsMessageId) {
  const data = await knex('SmsMessage as m')
    .innerJoin('SmsTemplate as tmpl', 'm.smsTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.smsMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' })
    .where({ 'm.id': smsMessageId })
    .first(
      'tmpl.message as messageTemplate',
      'tmpl.phoneNumber as phoneNumberTemplate'
    )
  return processUsingDataSourceQuery(data, [
    'messageTemplate',
    'phoneNumberTemplate',
  ])
}

module.exports = {
  onSmsMessageCreated,
  onSmsMessageReadyForSending,
}
