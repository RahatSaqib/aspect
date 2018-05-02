const _ = require('lodash')
const helper = require('sendgrid').mail

async function sendEmail(to, subject, htmlContent, textContent, attachments) {
  const fromEmail = new helper.Email(process.env['email.fromAddress'], 'Aspect')
  const toEmail = new helper.Email(to)
  const htmlBody = htmlContent
    ? new helper.Content('text/html', htmlContent)
    : undefined
  const textBody = textContent
    ? new helper.Content('text/plain', textContent)
    : undefined
  const emailMessage = new helper.Mail(
    fromEmail,
    subject.trim(),
    toEmail,
    textBody || htmlBody
  )

  if (textBody && htmlBody) {
    emailMessage.addContent(htmlBody)
  }

  if (_.isArray(attachments) && attachments.length) {
    attachments.forEach(att => {
      const attachment = new helper.Attachment()
      attachment.setContent(att.content)
      attachment.setType(att.mimeType)
      attachment.setFilename(att.fileName)
      attachment.setDisposition(att.disposition) // inline / attachment
      if (att.disposition === 'inline') {
        attachment.setContentId(att.fileName)
      }
      emailMessage.addAttachment(attachment)
    })
  }
  const sendGrid = require('sendgrid')(process.env['sendgrid.apiKey'])
  const request = sendGrid.emptyRequest({
    method: 'POST',
    path: '/v3/mail/send',
    body: emailMessage.toJSON(),
  })

  return sendGrid.API(request)
}

module.exports = {
  sendEmail,
}
