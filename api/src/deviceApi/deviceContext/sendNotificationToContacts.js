const logger = require('../../shared/logger')
const { sendSms } = require('../../sms/smsUtil')
const { sendEmail } = require('../../email/emailUtil')
const templateProcessor = require('../../email/templateProcessor')

/**
 * Sends notification emails/SMS to lab and installer contacts when a new device is created.
 *
 * @param {Object} payload - The request payload containing configuration data
 * @param {Object} device - The newly created device object
 */
async function sendNotificationToContacts(payload, device) {
  const { configuration } = payload
  if (configuration && configuration.data) {
    const configurationData = configuration.data
    const { culture, routerNumber, noInventory } = configurationData
    const labContact = {
      name: configurationData.labContactName,
      email: configurationData.labContactEmail,
      cell: configurationData.labContactCell,
    }

    const installerContact = {
      name: configurationData.installerName,
      email: configurationData.installerEmail,
      cell: configurationData.installerCell,
    }

    const { operation } = payload
    let cartridgeCount = null
    if (operation && operation.data && operation.data.inventoryChanges && operation.data.inventoryChanges.length > 0) {
      cartridgeCount = operation.data.inventoryChanges.reduce(
        (accumulator, inventoryChange) => accumulator + inventoryChange.quantity,
        0
      )
    }

    await Promise.all([
      notifyPerson(labContact, device.name, routerNumber, noInventory, culture, cartridgeCount),
      notifyPerson(installerContact, device.name, routerNumber, noInventory, culture, cartridgeCount),
    ])
  }
}

/**
 * Sends notification to a single person (email and/or SMS).
 *
 * @param {Object} contact - Contact information {name, email, cell}
 * @param {string} deviceName - Name of the device
 * @param {string} routerNumber - Router number
 * @param {boolean} noInventory - Whether inventory is disabled
 * @param {string} culture - Culture/locale for template
 * @param {number} cartridgeCount - Number of cartridges
 */
async function notifyPerson({ name, email, cell }, deviceName, routerNumber, noInventory, culture, cartridgeCount) {
  const generatedTemplate = await templateProcessor.process(
    'newDevice',
    {
      deviceName,
      name,
      routerNumber,
      noInventory,
      cartridgeCount,
    },
    culture
  )

  if (email) {
    const inlineImageAttachments = await templateProcessor.getInlineImageAttachments(generatedTemplate.html)

    await sendEmail(
      email,
      generatedTemplate.subject,
      generatedTemplate.html,
      generatedTemplate.text,
      inlineImageAttachments
    ).catch(err => logger.error(err))
  }

  if (cell) {
    await sendSms(cell, generatedTemplate.text).catch(err => logger.warning(err))
  }
}

module.exports = {
  sendNotificationToContacts,
}
