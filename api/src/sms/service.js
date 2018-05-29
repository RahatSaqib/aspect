const { smsMessageReadyForSending, smsMessageSent } = require('./actions')
const dictionary = require('../shared/dictionary')
const { createSmsMessageFromTemplate } = require('../stringTemplate/service')

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
  const message = await createSmsMessageFromTemplate(knex, smsMessageId)
  const messageStatusId = (await dictionary.messageStatusToId()).Pending

  // store generated sms message into the same record and set messageStatusId
  await knex('SmsMessage')
    .where({ id: smsMessageId })
    .update({
      message,
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
    .leftJoin('Person as p', 'sm.personId', 'p.id')
    .where({ 'sm.id': smsMessageId })
    .first('sm.message', 'p.cell')

  const { cell, message } = d || {}

  // sms handler
  const { sendSms } = require('./smsUtil')

  // get name-id map of message statuses
  const messageStatusIdFor = await dictionary.messageStatusToId()

  // assume status is 'Sent'
  let messageStatusId = messageStatusIdFor.Sent

  // send sms
  await sendSms(cell, message).catch(() => {
    // set status to 'Error'
    messageStatusId = messageStatusIdFor.Error
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

module.exports = {
  onSmsMessageCreated,
  onSmsMessageReadyForSending,
}
