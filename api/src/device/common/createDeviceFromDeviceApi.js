const _ = require('lodash')
const { deviceApprovalToId } = require('../../shared/dictionary')
const { syncDeviceApprovalFromDeployments } = require('./deviceApprovalService')
const { assignGeneratedDeviceName } = require('./deviceNaming')
const logger = require('../../shared/logger')
const { sendSms } = require('../../sms/smsUtil')
const { sendEmail } = require('../../email/emailUtil')
const templateProcessor = require('../../email/templateProcessor')

/**
 * Creates a Device from a Device API payload (results and daily details both auto-register
 * devices the first time an instrument is seen).
 *
 * @param {Object} context - { knex, payload, now, deviceTypeId, deviceTypeExternalId, partnerId,
 *                             defaultTimeZone, partnerPluginName, deviceTypePluginName, auth }
 * @returns {Promise<Object>} the created device joined with its approval/type/site data
 */
async function createDeviceFromDeviceApi(context) {
  const { payload, now, deviceTypeId, deviceTypeExternalId, partnerId, defaultTimeZone, knex } = context
  const hostId = _.get(payload, 'configuration.data.hostId', null) || payload.hostId
  const serial = _.get(payload, 'configuration.data.deviceSerialNumber') || payload.serial
  const macAddress = _.get(payload, 'configuration.data.macAddress') || payload.macAddress

  // Temporary non-null placeholder; the real name is generated after insert
  // (it depends on the auto-increment Device.id) via the device-naming plugin.
  const placeholderName = (serial || hostId || deviceTypeExternalId || 'device').substr(0, 45)

  const deviceApprovalId = await deviceApprovalToId('pendingDeployment')
  const deviceApiKey = await knex('DeviceApiKey')
    .where({ id: context.auth.credentials.deviceApiKeyId })
    .first('id', 'siteId')

  const partnerData = await knex('Partner').where({ id: partnerId }).first('deviceCapacityFactor')

  const [deviceId] = await knex('Device').insert({
    partnerId,
    deviceTypeId,
    siteId: deviceApiKey?.siteId || null,
    dailyTestCapacity: deviceTypeExternalId === 'CepheidGeneXpert' ? partnerData.deviceCapacityFactor * 4 : null, // for CepheidGeneXpert we are using module=4
    moduleBayCapacity: deviceTypeExternalId === 'CepheidGeneXpert' ? 4 : 0,
    deviceApprovalId,
    name: placeholderName,
    serial,
    shortName: placeholderName,
    macAddress,
    hostId,
    timezone: defaultTimeZone, // For now we ignore this _.get(payload, 'configuration.data.timezone', null)
    configurationData: '{}',
    deviceApiKeyId: context.auth.credentials.deviceApiKeyId,
    putInService: now, // TODO?
    lastSeenOn: now,
    lastPingOn: now,
    createdOn: now,
    updatedOn: now,
  })

  await assignGeneratedDeviceName(knex, {
    deviceId,
    deviceTypeId,
    partnerPluginName: context.partnerPluginName,
    deviceTypePluginName: context.deviceTypePluginName,
  })

  await knex('DeviceApprovalLog').insert({
    deviceId,
    deviceApprovalId,
    changedOn: now,
    createdOn: now,
    createdBy: null,
  })

  if (deviceApiKey?.siteId) {
    await knex('Deployment').insert({
      deviceId,
      siteId: deviceApiKey.siteId,
      start: null,
      end: null,
      createdOn: now,
      createdBy: null,
      updatedOn: now,
      updatedBy: null,
    })

    await syncDeviceApprovalFromDeployments(knex, { deviceId, userId: null, now })
  }

  const device = await knex('Device as d')
    .leftJoin('Site as s', 'd.siteId', 's.id')
    .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .where('d.id', deviceId)
    // TODO: this proyection should be the same as identifyDevice
    .first(
      'd.id',
      'd.partnerId',
      'd.siteId',
      's.geographyId',
      'd.name',
      'd.shortName',
      'd.serial',
      'd.macAddress',
      'd.configurationData',
      'd.connectSettingsSentOn',
      'd.lastSeenOn',
      'd.putInService',
      'da.token as approval',
      'dt.externalId as deviceType',
      'dt.plugin as deviceTypePluginName',
      'p.plugin as partnerPluginName',
      'dtc.name as deviceTypeCategory'
    )

  // TODO: Refactor this to an event
  // Send notifications
  // Commented for now, This notification should be sent only once per GxConnect instance, in this place we are going to generate multiple notifications
  // await sendNotificationToContacts(payload, device)

  return device
}

/**
 * Sends notification emails/SMS to lab and installer contacts when a new device is created.
 *
 * @param {Object} payload - The request payload containing configuration data
 * @param {Object} device - The newly created device object
 */
// eslint-disable-next-line no-unused-vars
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

module.exports = { createDeviceFromDeviceApi }
