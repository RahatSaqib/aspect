const _ = require('lodash')
const nodemailer = require('nodemailer')
const config = require('../config')

async function sendEmail(to, subject, htmlContent, textContent, attachments) {
  const transporter = nodemailer.createTransport(
    {
      host: config.email.host,
      port: config.email.port,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    },
    {
      from: {
        name: 'Aspect',
        address: config.email.fromEmail,
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
