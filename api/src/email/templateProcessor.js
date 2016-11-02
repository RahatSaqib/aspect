const EmailTemplate = require('email-templates').EmailTemplate
const path = require('path')
const Promise = require('bluebird')
const encode = Promise.promisify(require('node-base64-image').encode)
const readdir = Promise.promisify(require('fs').readdir)

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

function* generateAttachment(pathToFile, mimeType = 'application/octet-stream', disposition = 'attachment') {
  return {
    content: yield encode(pathToFile, { string: true, local: true }),
    mimeType: mimeType,
    fileName: path.basename(pathToFile),
    disposition: disposition
  }
}

function* getInlineImageAttachments(htmlContent) {
  const templateDir = path.join(__dirname, 'templates'),
    extensionMimeTypeMappings = {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.bmp': 'image/bmp'
    },
    directoryItems = yield readdir(templateDir),
    attachments = []
  for(let i = 0; i < directoryItems.length; i++) {
    if(htmlContent.indexOf('cid:' + directoryItems[i]) > -1) {
      const fileExtension = path.extname(directoryItems[i]).toLowerCase(),
        mimeType = extensionMimeTypeMappings[fileExtension]
      if(mimeType) {
        attachments.push(yield* generateAttachment(path.join(__dirname, 'templates', directoryItems[i]), mimeType, 'inline'))
      }
    }
  }
  return attachments
}

module.exports = {
  process,
  generateAttachment,
  getInlineImageAttachments
}
