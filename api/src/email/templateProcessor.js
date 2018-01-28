const { EmailTemplate } = require('email-templates')
const path = require('path')
const { promisify } = require('util')
const _ = require('lodash')
const encode = promisify(require('node-base64-image').encode)
const readdir = promisify(require('fs').readdir)

async function process(templateName, tokenValues, locale) {
  if (!locale) {
    locale = 'en-US'
  }

  const templateDir = path.join(__dirname, 'templates', templateName)
  const directoryItems = await readdir(templateDir)

  if (!directoryItems.includes(locale)) {
    locale = 'en-US'
  }

  const localeTemplateDir = path.join(templateDir, locale)
  const emailTemplate = new EmailTemplate(localeTemplateDir)

  return await new Promise((resolve, reject) => { //eslint-disable-line
    emailTemplate.render(tokenValues, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

async function generateAttachment(
  pathToFile,
  mimeType = 'application/octet-stream',
  disposition = 'attachment'
) {
  return {
    content: await encode(pathToFile, { string: true, local: true }),
    mimeType,
    fileName: path.basename(pathToFile),
    disposition,
  }
}

async function getInlineImageAttachments(htmlContent) {
  const templateDir = path.join(__dirname, 'templates')
  const extensionMimeTypeMappings = {
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.bmp': 'image/bmp',
  }
  const directoryItems = await readdir(templateDir)
  const attachments = []

  await Promise.all(
    _.map(_.range(directoryItems.length), async i => {
      if (htmlContent.indexOf(`cid:${directoryItems[i]}`) > -1) {
        const fileExtension = path.extname(directoryItems[i]).toLowerCase()
        const mimeType = extensionMimeTypeMappings[fileExtension]

        if (mimeType) {
          attachments.push(
            await generateAttachment(
              path.join(__dirname, 'templates', directoryItems[i]),
              mimeType,
              'inline'
            )
          )
        }
      }
    })
  )
  return attachments
}

module.exports = {
  process,
  generateAttachment,
  getInlineImageAttachments,
}
