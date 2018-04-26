const { emailMessageReadyForSending, emailMessageSent } = require('./actions')
const dictionary = require('../shared/dictionary')
const dataSources = require('../shared/dataSources')
const stringProcessor = require('../notification/stringProcessor')

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
  const data = await knex('EmailMessage as m')
    .innerJoin('EmailTemplate as tmpl', 'm.emailTemplateId', 'tmpl.id')
    .innerJoin('Person as p', 'm.personId', 'p.id')
    .leftJoin('Site as s', 'm.siteId', 's.id')
    .leftJoin('Device as d', 'm.deviceId', 'd.id')
    .leftJoin('Result as r', 'm.resultId', 'r.id')
    .where({ 'm.id': emailMessageId })
    .first(
      'tmpl.subject as subjectTemplate',
      'tmpl.body as bodyTemplate',
      'tmpl.htmlBody as htmlBodyTemplate',
      'm.personId',
      'm.siteId',
      'm.deviceId',
      'm.resultId',
      's.name as siteName',
      's.shortName as siteShortName',
      'p.name as personName'
    )

  const { subjectTemplate = '', bodyTemplate = '', htmlBodyTemplate = '' } =
    data || {}

  // merge template with data
  const ds = dataSources.getBaseDataSource(data)
  const subject = stringProcessor.mergeTemplateData(subjectTemplate, ds)
  const body = stringProcessor.mergeTemplateData(bodyTemplate, ds)
  const htmlBody = stringProcessor.mergeTemplateData(htmlBodyTemplate, ds)

  const messageStatusId = (await dictionary.messageStatusToId()).Pending

  // store generated email message into the same record and set messageStatusId
  await knex('EmailMessage')
    .where({ id: emailMessageId })
    .update({
      subject,
      body,
      htmlBody,
      messageStatusId,
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
    .leftJoin('Person as p', 'm.PersonId', 'p.id')
    .where({ 'm.id': emailMessageId })
    .first('m.subject', 'm.body', 'm.htmlBody', 'p.email', 'p.email2')

  const { email, subject, htmlBody, body } = d || {}

  // email handler
  const { sendEmail } = require('./emailUtil')

  // get name-id map of message statuses
  const messageStatusIdFor = await dictionary.messageStatusToId()

  // assume status is 'Sent'
  let messageStatusId = messageStatusIdFor.Sent

  // send email
  await sendEmail(email, subject, htmlBody, body)
    // .then(response => {
    //   console.log('Email has been sent out', response)
    // })
    .catch(() => {
      // set status to 'Error'
      messageStatusId = messageStatusIdFor.Error
    })

  // store status in db
  await knex('EmailMessage')
    .where({ id: emailMessageId })
    .update({
      messageStatusId,
      updatedOn: new Date(),
    })

  // dispatch EMAIL_MESSAGE_SENT to MQ
  context.emailMessageSent(emailMessageId)
}

module.exports = {
  onEmailMessageCreated,
  onEmailMessageReadyForSending,
}
