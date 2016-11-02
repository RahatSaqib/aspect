let Promise = require('bluebird')
const helper = require('sendgrid').mail

function* sendEmail(to, subject, htmlContent, textContent, attachments) {
  const fromEmail = new helper.Email(process.env['email.fromAddress'], 'Aspect'),
    toEmail = new helper.Email(to),
    htmlBody = htmlContent ? new helper.Content('text/html', htmlContent) : undefined,
    textBody = textContent ? new helper.Content('text/plain', textContent) : undefined,
    emailMessage = new helper.Mail(fromEmail, subject.trim(), toEmail, textBody || htmlBody)
  if(textBody && htmlBody) {
    emailMessage.addContent(htmlBody)
  }
  if(attachments && attachments.length) {
    attachments.forEach(function (att) {
      const attachment = new helper.Attachment()
      attachment.setContent(att.content)
      attachment.setType(att.mimeType)
      attachment.setFilename(att.fileName)
      attachment.setDisposition(att.disposition) //inline / attachment
      if(att.disposition === 'inline') {
        attachment.setContentId(att.fileName)
      }
      emailMessage.addAttachment(attachment)
    })
  }
  const sendGrid = require('sendgrid')(process.env['sendgrid.apiKey']),
    request = sendGrid.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: emailMessage.toJSON()
    })

  return new Promise((resolve, reject) => {
    sendGrid.API(request, function(error, response) {
      if(error) {
        reject(error)
      } else {
        resolve(response)
      }
    })
  })
}

module.exports = {
  sendEmail
}
