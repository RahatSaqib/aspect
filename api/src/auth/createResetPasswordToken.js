const uuid = require('node-uuid')
const Boom = require('@hapi/boom')
const emailUtil = require('../email/emailUtil')
const templateProcessor = require('../email/templateProcessor')

const { query } = require('../db')

async function createResetPasswordToken(request) {
  const { params } = request

  const users = await query('Get user details from email address')
    .from('Person as p')
    .innerJoin('User as u', 'p.userId', 'u.id')
    .where({ 'p.email': params.email })
    .orWhere({ 'p.email2': params.email })
    .select('u.id', 'p.name', 'p.culture')

  if (users.length === 1) {
    const resetPasswordToken = uuid.v4()
    const now = new Date()
    const expires = new Date(now.getTime() + 3600000)
    const generatedEmail = await templateProcessor.process(
      'resetPassword',
      {
        name: users[0].name,
        aspectUrl: process.env.aspectUrl,
        resetPasswordToken,
      },
      users[0].culture
    )
    const inlineImageAttachments = await templateProcessor.getInlineImageAttachments(generatedEmail.html)

    await emailUtil.sendEmail(
      params.email,
      generatedEmail.subject,
      generatedEmail.html,
      generatedEmail.text,
      inlineImageAttachments
    )

    await query('Save reset password token').from('User as u').where('u.id', users[0].id).update({
      resetPasswordToken,
      resetPasswordTokenExpires: expires,
    })
  } else if (users.length > 1) {
    return Boom.conflict('Could not pinpoint the user from the email address provided')
  }

  return {
    ok: true,
  }
}

module.exports = {
  createResetPasswordToken,
}
