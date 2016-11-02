const EmailTemplate = require('email-templates').EmailTemplate
const path = require('path')
const Promise = require('bluebird')
const encode = Promise.promisify(require('node-base64-image').encode)

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

function generateAttachment(pathToFile, mimeType = 'application/octet-stream', disposition = 'attachment') {
  return encode(pathToFile, { string: true, local: true }).then(function(result) {
    return {
      content: result,
      mimeType: mimeType,
      fileName: path.basename(pathToFile),
      disposition: disposition
    }
  })
}

module.exports = {
  process,
  generateAttachment
}
