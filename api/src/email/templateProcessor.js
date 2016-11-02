const EmailTemplate = require('email-templates').EmailTemplate
const path = require('path')

function process(templateName, tokenValues, locale) {
  if(!locale) {
    locale = 'en-US'
  }
  const templateDir = path.join(__dirname, 'templates', templateName, locale),
    emailTemplate = new EmailTemplate(templateDir)

  return emailTemplate.render(tokenValues, function(err, result) {
    if(err) {
      throw err
    }
    return result
  })
}

module.exports = {
  process
}
