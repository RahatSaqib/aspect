const _ = require('lodash')
const nodemailer = require('nodemailer')

async function sendEmail(to, subject, htmlContent, textContent, attachments) {
  const transporter = nodemailer.createTransport(
    {
      host: process.env['email.host'],
      port: process.env['email.port'] || 465,
      auth: {
        user: process.env['email.user'],
        pass: process.env['email.password'],
      },
    },
    {
      from: {
        name: 'Aspect',
        address: process.env['email.fromEmail'],
      },
    }
  )

  const message = {
    to,
    subject: subject.trim(),
    text: textContent,
    html: htmlContent,
    attachments: _.map(attachments, att => ({
      content: att.content,
      filename: att.fileName,
      contentType: att.mimeType,
      contentDisposition: att.disposition,
      cid: att.fileName,
      encoding: 'base64',
    })),
  }

  return transporter.sendMail(message)
}

module.exports = {
  sendEmail,
}
