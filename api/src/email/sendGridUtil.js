const mail = require('sendgrid').mail

function* sendEmail(to, subject, htmlContent, textContent, attachments) {
  const fromEmail = new mail.Email(process.env['email.fromAddress'], 'Aspect'),
    toEmail = new mail.Email(to),
    htmlBody = htmlContent ? new mail.Content('text/html', htmlContent) : undefined,
    textBody = textContent ? new mail.Content('text/html', textContent) : undefined,
    emailMessage = new mail.Mail(fromEmail, subject, toEmail)
  if(htmlBody) {
    emailMessage.addContent(htmlBody)
  }
  if(textBody) {
    emailMessage.addContent(textBody)
  }
  if(attachments && attachments.length) {
    attachments.forEach(function (att) {
      const attachment = new mail.Attachment()
      attachment.setContent(att.content)
      attachment.setType(att.mimeType)
      attachment.setFilename(att.fileName)
      attachment.setDisposition(att.disposition) //inline / attachment
      if(att.disposition === 'inline') {
        attachment.setContentId(att.fileName)
      }
      mail.addAttachment(attachment)
    })
  }
  const sendGrid = require('sendgrid')(process.env['sendgrid.apiKey']),
    request = sendGrid.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: emailMessage.toJSON()
    })

  return sendGrid.API(request, function(error, response) {
    if(error) {
      return Promise.reject(error)
    }
    return response
  })
}

module.exports = {
  sendEmail
}
