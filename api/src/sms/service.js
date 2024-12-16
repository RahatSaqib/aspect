const _ = require('lodash')
const { stringify } = require('flatted')
const { smsMessageReadyForSending, smsMessageProcessed } = require('./actions')
const { notificationMessageProcessed } = require('../notification/actions')
const { allMessageStatusToId, messageStatusToId } = require('../shared/dictionary')
const { addDataSourceToQuery, processUsingDataSourceQuery } = require('../stringTemplate/service')
const { getConstraints } = require('../auth/constraints')
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
    personCell: cell,
    personCellE164: cellE164,
    countryAbbreviation: countryCode,
  } = (await createSmsMessageFromTemplate(knex, smsMessageId)) || {}
  if (!_.isEmpty(phone)) {
    const messageStatusId = await messageStatusToId('Pending')
    const phoneNumber = phone ?? cellE164 ?? normalizePhoneNumber(cell, countryCode)

    if (!phoneNumber) return
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
    smsMessageProcessed,
  })

  return context.transact(async knex => {
    const partnerDetails = await knex('SmsMessage as sm')
      .join('Notification as n', 'sm.id', 'n.emailMessageId')
      .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
      .join('Partner as p', 'nt.partnerId', 'p.id')
      .where({ 'sm.id': smsMessageId })
      .first('*')
    const smsMessageCount = await knex('SmsMessage as sm')
      .join('Device as d', 'sm.deviceId', 'd.id')
      .where('sm.createdOn', '>', partnerDetails?.serviceStartDate)
      .where('sm.createdOn', '<', partnerDetails?.serviceEndDate)
      .andWhere('d.partnerId', partnerDetails?.partnerId)
      .first('*')
      .count('* as count')

    if (
      partnerDetails?.serviceStartDate &&
      partnerDetails?.notificationLimit &&
      new Date(partnerDetails?.serviceEndDate || '2099-01-01') > new Date() &&
      smsMessageCount?.count <= partnerDetails?.notificationLimit
    ) {
      await doSendSmsMessage(context, knex, smsMessageId)
    } else {
      await knex('SmsMessage').where({ id: smsMessageId }).update({
        messageStatusId: 4,
        updatedOn: new Date(),
      })
    }
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
  let errorData = null
  // send sms
  await sendSms(cell, message).catch(ex => {
    errorData = stringify({ ...ex, cell, message })
    // set status to 'Error'

    messageStatusId = messageStatusIdError
  })

  // store status in db
  await knex('SmsMessage').where({ id: smsMessageId }).update({
    messageStatusId,
    updatedOn: new Date(),
    errorData,
  })

  // dispatch SMS_MESSAGE_PROCESSED to MQ
  context.smsMessageProcessed(smsMessageId)

  context.bindActionCreators({
    notificationMessageProcessed,
  })
  context.notificationMessageProcessed({ smsMessageId })
}

async function createSmsMessageFromTemplate(knex, smsMessageId) {
  const { personId, resultId, reportId } =
    (await knex('SmsMessage as s')
      .leftJoin('Notification as n', 'n.smsMessageId', 's.id')
      .where('s.id', smsMessageId)
      .first('s.personId', 's.resultId', 'n.reportId')) || {}

  const authLikeObject = { credentials: { personId } }
  const dataConstraints = await getConstraints(authLikeObject.credentials)

  const data = await knex('SmsMessage as m')
    .innerJoin('SmsTemplate as tmpl', 'm.smsTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.smsMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' }, dataConstraints, resultId, reportId)
    .where({ 'm.id': smsMessageId })
    .first(
      'tmpl.message as messageTemplate',
      'tmpl.phoneNumber as phoneNumberTemplate',
      knex.raw('m.phoneNumber as phoneNumber'),
      knex.raw('p.cell as personCell'),
      knex.raw('p.cellE164 as personCellE164')
    )

  return processUsingDataSourceQuery(
    data,
    ['messageTemplate', 'phoneNumberTemplate', 'personCellE164Template', 'personCellTemplate', 'countryAbbreviation'],
    authLikeObject
  )
}

module.exports = {
  onSmsMessageCreated,
  onSmsMessageReadyForSending,
  doSendSmsMessage,
}
