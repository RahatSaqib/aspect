const _ = require('lodash')
const { smsMessageReadyForSending, smsMessageSent } = require('./actions')
const { allMessageStatusToId, messageStatusToId } = require('../shared/dictionary')
const { addDataSourceToQuery, processUsingDataSourceQuery } = require('../stringTemplate/service')
const { getConstraints, addConstraints } = require('../auth/constraints')
const logger = require('../shared/logger')
const { normalizePhoneNumber } = require('../shared/phoneNormalization')

// -----------------------------
// onSmsMessageCreated - event handler for action SMS_MESSAGE_CREATED
// -----------------------------
async function onSmsMessageCreated({ smsMessageId }, { messageContext }) {
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
  const {
    message,
    phoneNumber: phone,
    countryAbbreviation: countryCode,
  } = await createSmsMessageFromTemplate(knex, smsMessageId)
  if (!_.isEmpty(phone)) {
    const messageStatusId = await messageStatusToId('Pending')
    const phoneNumber = normalizePhoneNumber(phone, countryCode)

    // store generated sms message into the same record and set messageStatusId
    await knex('SmsMessage').where({ id: smsMessageId }).update({
      message,
      phoneNumber,
      messageStatusId,
      updatedOn: new Date(),
    })

    // dispatch SMS_MESSAGE_READY_FOR_SENDING to MQ
    context.smsMessageReadyForSending(smsMessageId)
  }
}

// -----------------------------
// onSmsMessageReadyForSending - event handler for SMS_MESSAGE_READY_FOR_SENDING
// -----------------------------
async function onSmsMessageReadyForSending({ smsMessageId }, { messageContext }) {
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
  const sms = await knex('SmsMessage as sm')
    .where({ 'sm.id': smsMessageId })
    .first('sm.message', 'sm.phoneNumber as cell')

  const { cell, message } = sms || {}
  logger.debug(` Sending ${smsMessageId} to ${cell} with ${message}`, {
    reLabel: 'aspect:sms:send',
  })
  // sms handler
  const { sendSms } = require('./smsUtil')

  // assume status is 'Sent'
  const { Sent: messageStatusIdSent, Error: messageStatusIdError } = await allMessageStatusToId()
  let messageStatusId = messageStatusIdSent

  // send sms
  await sendSms(cell, message).catch(() => {
    // set status to 'Error'
    messageStatusId = messageStatusIdError
  })

  // store status in db
  await knex('SmsMessage').where({ id: smsMessageId }).update({
    messageStatusId,
    updatedOn: new Date(),
  })

  // dispatch SMS_MESSAGE_SENT to MQ
  context.smsMessageSent(smsMessageId)
}

async function createSmsMessageFromTemplate(knex, smsMessageId) {
  const { personId, resultId } = await knex('SmsMessage').where('id', smsMessageId).first('personId', 'resultId')

  const dataConstraints = await getConstraints({ personId })

  const data = await knex('SmsMessage as m')
    .innerJoin('SmsTemplate as tmpl', 'm.smsTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.smsMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' }, resultId)
    .modify(queryBuilder => {
      if (!_.isEmpty(dataConstraints)) {
        queryBuilder.modify(addConstraints, dataConstraints, {
          assay: 'a',
          partner: 'pr',
          device: 'd',
          deviceType: 'dt',
          person: 'p',
          /*
          result: 'r',
          ^^^ Leaving this commented out to  highlight the fact that adding these
              constraints will break the RO notifications configured for Myanmar
          */
          sample: 'sample',
          site: 's',
          showUnapprovedDevices: true,
          showDecommissionedDevices: true,
        })
      }
    })
    .where({ 'm.id': smsMessageId })
    .first(
      'tmpl.message as messageTemplate',
      'tmpl.phoneNumber as phoneNumberTemplate',
      knex.raw('IFNULL(m.phoneNumber,p.cell) as personCell')
    )
  return processUsingDataSourceQuery(data, ['messageTemplate', 'phoneNumberTemplate', 'countryAbbreviation'])
}

module.exports = {
  onSmsMessageCreated,
  onSmsMessageReadyForSending,
}
