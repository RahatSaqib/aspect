const sendGrid = require('sendgrid')
const mail = sendGrid.mail

function* sendEmail(to, subject, htmlContent) {
  const fromEmail = new mail.Email(process.env['email.fromAddress'], 'Aspect'),
    toEmail = new mail.Email(to),
    emailBody = new mail.Content('txt/html', htmlContent),
    emailMessage = new mail.Mail(fromEmail, subject, toEmail, emailBody),
    sendGrid = sendGrid(process.env['sendgrid.apiKey']),
    request = sendGrid.emptyRequest({
      method: 'POST',
      path: '/v3/mail/send',
      body: emailMessage.toJSON()
    })

  return yield sendGrid.API(request, function(error, response) {
    if(error) {
      return Promise.reject(error)
    }
    return Promise.resolve(response)
  })
}

module.exports = {
  sendEmail
}
