const _ = require('lodash')
const Promise = require('bluebird')
const { subDays, subMonths } = require('date-fns')

const { emailMessageReadyForSending, emailMessageSent } = require('./actions')
const { allMessageStatusToId, messageStatusToId } = require('../shared/dictionary')
const { addDataSourceToQuery, processUsingDataSourceQuery } = require('../stringTemplate/service')
const { getConstraints } = require('../auth/constraints')
const { generateCsvAttachment } = require('../shared/io')
const { getDeviceErrorHistoryForAttachment } = require('../result/serviceReport')
const { startOfDayUtc, startOfMonthUTC, endOfMonthUTC } = require('../shared/date')

// -----------------------------
// onEmailMessageCreated - event handler for action EMAIL_MESSAGE_CREATED
// -----------------------------
async function onEmailMessageCreated({ emailMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    emailMessageReadyForSending,
  })
  return context.transact(async knex => {
    // after email message entry created - process it's template and merge it with data
    await prepareEmailMessageForSending(context, knex, emailMessageId)
  })
}

// -----------------------------
// prepareEmailMessageForSending
// -----------------------------
async function prepareEmailMessageForSending(context, knex, emailMessageId) {
  const { subject, body, htmlBody, to, attachments } = await createEmailFieldsFromTemplate(knex, emailMessageId)

  const pendingMessageStatusId = await messageStatusToId('Pending')
  // store generated email message into the same record and set messageStatusId
  await knex('EmailMessage')
    .where({ id: emailMessageId })
    .update({
      subject,
      body,
      htmlBody,
      to,
      messageStatusId: pendingMessageStatusId,
      updatedOn: new Date(),
      attachments: JSON.stringify(attachments),
    })

  // dispatch EMAIL_MESSAGE_READY_FOR_SENDING to MQ
  context.emailMessageReadyForSending(emailMessageId)
}

// -----------------------------
// onEmailMessageReadyForSending - event handler for EMAIL_MESSAGE_READY_FOR_SENDING
// -----------------------------
async function onEmailMessageReadyForSending({ emailMessageId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    emailMessageSent,
  })

  return context.transact(async knex => {
    await doSendEmailMessage(context, knex, emailMessageId)
  })
}

// -----------------------------
// doSendEmailMessage
// -----------------------------
async function doSendEmailMessage(context, knex, emailMessageId) {
  // get message and cell phone
  const d = await knex('EmailMessage')
    .where('id', emailMessageId)
    .first('subject', 'body', 'htmlBody', 'to', 'attachments')
  const { subject, htmlBody, body, to, attachments: stringifiedAttachmentArray } = d || {}
  const attachments = JSON.parse(stringifiedAttachmentArray || '[]')

  // email handler
  const { sendEmail } = require('./emailUtil')

  // assume status is 'Sent'
  const { Sent: messageStatusIdSent, Error: messageStatusIdError } = await allMessageStatusToId()
  let messageStatusId = messageStatusIdSent

  // send email
  const sendResponse = await sendEmail(to, subject, htmlBody, body, attachments).catch(err => {
    // set status to 'Error'
    messageStatusId = messageStatusIdError
    return err
  })

  // store status in db
  await knex('EmailMessage')
    .where({ id: emailMessageId })
    .update({
      messageStatusId,
      sendResponse: JSON.stringify(sendResponse),
      updatedOn: new Date(),
    })

  // dispatch EMAIL_MESSAGE_SENT to MQ
  context.emailMessageSent(emailMessageId)
}

async function createEmailFieldsFromTemplate(knex, emailMessageId) {
  const {
    personId,
    resultId,
    reportId,
    to = null,
    email,
    email2,
  } = (await knex('EmailMessage as m')
    .leftJoin('Person as p', 'm.personId', 'p.id')
    .leftJoin('Notification as n', 'n.emailMessageId', 'm.id')
    .where({ 'm.id': emailMessageId })
    .first('m.personId', 'm.resultId', 'n.reportId', 'm.to', 'p.email', 'p.email2')) || {}

  const authLikeObject = { credentials: { personId } }
  const dataConstraints = await getConstraints(authLikeObject.credentials)

  const data = await knex('EmailMessage as m')
    .innerJoin('EmailTemplate as tmpl', 'm.emailTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.emailMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' }, dataConstraints, resultId, reportId)
    .where({ 'm.id': emailMessageId })
    .first(
      'tmpl.subject as subjectTemplate',
      'tmpl.body as bodyTemplate',
      'tmpl.htmlBody as htmlBodyTemplate',
      'tmpl.to as toTemplate',
      'tmpl.attachments'
    )

  if (data && data.geographyId) {
    data.siteContacts = await knex('JobContext as jc')
      .join('Job as j', 'jc.jobId', 'j.id')
      .join('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
      .join('Person as p', 'j.personId', 'p.id')
      .where({ 'jc.siteId': data.siteId })
      .where({ 'jf.externalId': 'labUser' })
      .select('p.name', 'p.title', 'p.phone', 'p.cell', 'p.email')
  }
  const processedTemplateFields = await processUsingDataSourceQuery(
    data,
    ['subjectTemplate', 'bodyTemplate', 'htmlBodyTemplate', 'toTemplate'],
    authLikeObject
  )
  if (!processedTemplateFields.to) {
    processedTemplateFields.to = _.uniq(
      _.compact([to, email, email2].map(address => address?.toLowerCase().trim()))
    ).join(',')
  }
  const attachmentProps = JSON.parse((data && data.attachments) || '[]')

  if (!_.isEmpty(attachmentProps)) {
    processedTemplateFields.attachments = await generateAttachments(attachmentProps, data)
  }

  return processedTemplateFields
}

async function generateAttachments(attachmentProps, data) {
  const attachments = []
  await Promise.each(attachmentProps, async attachmentItem => {
    const { type } = attachmentItem
    const now = new Date()
    let reportData = null
    if (type === 'error-history') {
      // get deviceId from feeding 'data' of this email
      const { deviceId } = data
      // period token is defined in EmailTemplate in JSON 'attachments'
      const { period } = attachmentItem

      let minDate
      let maxDate = null
      if (period === 'last-30-days') {
        minDate = startOfDayUtc(subDays(new Date(), 30))
      } else {
        // last month
        const previousMonth = subMonths(now, 1)
        minDate = startOfMonthUTC(previousMonth)
        maxDate = endOfMonthUTC(previousMonth)
      }
      reportData = await getDeviceErrorHistoryForAttachment(deviceId, minDate, maxDate)
    }

    if (reportData) {
      // get CSV attachment
      const attachment = await generateCsvAttachment(`${type}.csv`, reportData)
      attachments.push(attachment)
    }
  })
  return attachments
}

module.exports = {
  onEmailMessageCreated,
  onEmailMessageReadyForSending,
}
