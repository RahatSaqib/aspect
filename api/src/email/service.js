const { emailMessageReadyForSending, emailMessageSent } = require('./actions')
const {
  allMessageStatusToId,
  messageStatusToId,
} = require('../shared/dictionary')
const {
  addDataSourceToQuery,
  processUsingDataSourceQuery,
} = require('../stringTemplate/service')
const { getConstraints, addConstraints } = require('../auth/constraints')

// -----------------------------
// onEmailMessageCreated - event handler for action EMAIL_MESSAGE_CREATED
// -----------------------------
function onEmailMessageCreated({ emailMessageId }, { messageContext }) {
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
  const { subject, body, htmlBody } = await createEmailFieldsFromTemplate(
    knex,
    emailMessageId
  )
  const pendingMessageStatusId = await messageStatusToId('Pending')

  // store generated email message into the same record and set messageStatusId
  await knex('EmailMessage').where({ id: emailMessageId }).update({
    subject,
    body,
    htmlBody,
    messageStatusId: pendingMessageStatusId,
    updatedOn: new Date(),
  })

  // dispatch EMAIL_MESSAGE_READY_FOR_SENDING to MQ
  context.emailMessageReadyForSending(emailMessageId)
}

// -----------------------------
// onEmailMessageReadyForSending - event handler for EMAIL_MESSAGE_READY_FOR_SENDING
// -----------------------------
function onEmailMessageReadyForSending({ emailMessageId }, { messageContext }) {
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
  const d = await knex('EmailMessage as m')
    .leftJoin('Person as p', 'm.personId', 'p.id')
    .where({ 'm.id': emailMessageId })
    .first('m.subject', 'm.body', 'm.htmlBody', 'p.email', 'p.email2')

  const { email, subject, htmlBody, body } = d || {}

  // email handler
  const { sendEmail } = require('./emailUtil')

  // assume status is 'Sent'
  const {
    Sent: messageStatusIdSent,
    Error: messageStatusIdError,
  } = await allMessageStatusToId()
  let messageStatusId = messageStatusIdSent

  // send email
  const sendResponse = await sendEmail(email, subject, htmlBody, body).catch(
    err => {
      // set status to 'Error'
      messageStatusId = messageStatusIdError
      return err
    }
  )

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
  const { personId } = await knex('EmailMessage')
    .where('id', emailMessageId)
    .first('personId')
  const dataConstraints = await getConstraints({ personId })
  const data = await knex('EmailMessage as m')
    .innerJoin('EmailTemplate as tmpl', 'm.emailTemplateId', 'tmpl.id')
    .leftJoin('Notification as n', 'n.emailMessageId', 'm.id')
    .modify(addDataSourceToQuery, { message: 'm', notification: 'n' })
    .modify(addConstraints, dataConstraints, {
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
    .where({ 'm.id': emailMessageId })
    .first(
      'tmpl.subject as subjectTemplate',
      'tmpl.body as bodyTemplate',
      'tmpl.htmlBody as htmlBodyTemplate'
    )

  if (data.geographyId) {
    const { siteContacts } = await knex('Person as p')
      .where({ geographyId: data.geographyId })
      .first(knex.raw('GROUP_CONCAT(p.name) as siteContacts'))
    data.siteContacts = siteContacts
  }
  return processUsingDataSourceQuery(data, [
    'subjectTemplate',
    'bodyTemplate',
    'htmlBodyTemplate',
  ])
}

module.exports = {
  onEmailMessageCreated,
  onEmailMessageReadyForSending,
}
