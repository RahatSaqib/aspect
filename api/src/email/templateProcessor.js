const EmailTemplate = require('email-templates').EmailTemplate
const path = require('path')
const Promise = require('bluebird')
const encode = Promise.promisify(require('node-base64-image').encode)
const readdir = Promise.promisify(require('fs').readdir)

function* process(templateName, tokenValues, locale) {
  if (!locale) {
    locale = 'en-US'
  }

  const templateDir = path.join(__dirname, 'templates', templateName)
  const directoryItems = yield readdir(templateDir)

  if (!directoryItems.includes(locale)) {
    locale = 'en-US'
  }

  const localeTemplateDir = path.join(templateDir, locale)
  const emailTemplate = new EmailTemplate(localeTemplateDir)

  return yield new Promise((resolve, reject) => {
    emailTemplate.render(tokenValues, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

function* generateAttachment(pathToFile, mimeType = 'application/octet-stream', disposition = 'attachment') {
  return {
    content: yield encode(pathToFile, { string: true, local: true }),
    mimeType,
    fileName: path.basename(pathToFile),
    disposition
  }
}

function* getInlineImageAttachments(htmlContent) {
  const templateDir = path.join(__dirname, 'templates')
  const extensionMimeTypeMappings = {
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.bmp': 'image/bmp'
  }
  const directoryItems = yield readdir(templateDir)
  const attachments = []

  for (let i = 0; i < directoryItems.length; i++) {
    if (htmlContent.indexOf(`cid:${directoryItems[i]}`) > -1) {
      const fileExtension = path.extname(directoryItems[i]).toLowerCase()
      const mimeType = extensionMimeTypeMappings[fileExtension]

      if (mimeType) {
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
