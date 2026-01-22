const Boom = require('@hapi/boom')
const _ = require('lodash')
const { deviceTypeToPlugin } = require('../shared/dictionary')
const { getUser } = require('../auth/service')
const {
  resultUpdated,
  types: { RESULT_UPDATED },
} = require('../result/actions')
const { knex, transact } = require('../db')
const { loadPlugin } = require('../plugin/loadPlugin')
const logger = require('../shared/logger')
const { createNewDevice } = require('./device')
const { sendSms } = require('../sms/smsUtil')
const { sendEmail } = require('../email/emailUtil')
const templateProcessor = require('../email/templateProcessor')
const { DEVICE_LOG_TYPE_NONE, DEVICE_LOG_TYPE_RESULT, DEVICE_LOG_TYPE_OPERATION } = require('./constants')

class DeviceApiContext {
  constructor(props) {
    Object.assign(this, props)
    this.resultUpdated = this.resultUpdated.bind(this)
    this.actions = { resultUpdated: this.resultUpdated }
  }

  static createDeviceApiContext = async (handler, originalRequest, defaultHandlerOptions) => {
    const handlerOptions = await getHandlerOptionsFromRequest(handler, originalRequest, defaultHandlerOptions)
    const request = {
      auth: originalRequest.auth,
      params: originalRequest.params,
      payload: originalRequest.payload,
      query: originalRequest.query,
    }
    const { createDevice = false, deviceLogType = DEVICE_LOG_TYPE_NONE } = handlerOptions

    const messageContext = originalRequest.plugins.messageContext.bindActionCreators({
      resultUpdated,
    })

    const { auth } = request
    const now = new Date()

    const existingDeviceAndData = await knex('DeviceApiKey as dak')
      .innerJoin('Device as d', 'dak.deviceId', 'd.id')
      .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
      .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
      .leftJoin('Site as s', 'd.siteId', 's.id')
      .leftJoin('Geography as g', 's.geographyId', 'g.id')
      .leftJoin('Country as c', 'g.countryId', 'c.id')
      .leftJoin('Partner as p', 'p.id', 'd.partnerId')
      .where({
        'dak.token': auth.credentials.token,
        'dak.revoked': false,
      })
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
        'dtc.name as deviceTypeCategory',
        'c.abbreviation as countryAbbreviation',
        'dak.token'
      )

    let device = null
    // In the case of GxAlert, the device and the device API key were already created on seeding so no need to create a new device
    if (existingDeviceAndData != null) {
      device = existingDeviceAndData
    } else if (createDevice) {
      const deviceAndError = await createNewDeviceFromRequest(request, now)
      if (deviceAndError.error) {
        return deviceAndError
      }
      ;({ device } = deviceAndError)

      await sendNotificationToContacts(originalRequest.payload, device)
    }

    if (!device) {
      // Trying to retrieve data for Device that has
      // none uploaded yet, but we have authorized the token
      return { error: Boom.notFound('No device found') }
    }

    const partner = await knex('Partner as p')
      .innerJoin('Device as d', 'd.partnerId', 'p.id')
      .where({ 'd.id': device.id })
      .first('p.id', 'p.deviceLogHistoryDays', 'p.plugin as partnerPluginName')
    if (!partner) {
      return { error: Boom.internal('Device not assigned to partner') }
    }

    let { id: userId } = (await getUser(auth.credentials.name)) || {}
    if (!userId) {
      ;({ createdBy: userId } = await knex('Device').where('id', device.id).first('createdBy'))
    }

    const context = new DeviceApiContext({
      auth,
      userId,
      now,
      device,
      payload: request.payload,
      query: request.query,
      messageContext,
      deviceLogType,
      partnerId: partner.id,
      partnerPluginName: partner.partnerPluginName,
      deviceTypePluginName: device.deviceTypePluginName,
    })

    // Add Device Log if requested
    if (deviceLogType !== DEVICE_LOG_TYPE_NONE) {
      const { resultId } = request.query

      if (!existingDeviceAndData) {
        // We will only have a device log if we already had a device
        return { error: Boom.notFound('Device does not have data.') }
      }

      // return last one for this device
      const lastDeviceLogQuery = knex('DeviceLog as dl')
        .where({ 'dl.deviceId': device.id })
        .orderBy('dl.id', 'desc')
        .first('dl.id', 'dl.resultId', 'dl.createdOn', 'dl.source')
      if (deviceLogType === DEVICE_LOG_TYPE_RESULT) {
        if (resultId) {
          lastDeviceLogQuery.where({ 'r.externalId': resultId })
        }
      } else if (deviceLogType === DEVICE_LOG_TYPE_OPERATION) {
        lastDeviceLogQuery.whereNotNull('dl.deviceOperationId')
      }
      const lastDeviceLog = await lastDeviceLogQuery
      context.deviceLog = lastDeviceLog || null

      return {
        error: lastDeviceLog ? false : Boom.notFound('Cannot find Logs records for the specific device'),
        context,
      }
    }

    // finally, all is well
    return { context }
  }

  withPayload(payload) {
    return new DeviceApiContext({ ...this, payload, parent: this })
  }

  addDeviceLogUpdate(prop, value) {
    if (this.parent) {
      this.parent.addDeviceLogUpdate(prop, value)
    } else {
      let update = this.deviceLogUpdate
      if (!update) {
        update = {}
        this.deviceLogUpdate = update
      }

      // add result updated on first device log update
      if (prop === 'resultId' && update[prop] == null) {
        this.resultUpdated(value, this.deviceLogId)
      }
      update[prop] = value
    }
  }

  resultUpdated(resultId, deviceLogId) {
    if (this.parent) {
      this.parent.resultUpdated(resultId, deviceLogId)
    } else if (
      _.findIndex(this.messageContext.actions, {
        type: RESULT_UPDATED,
        resultId,
      }) === -1
    ) {
      // only dispatch result updated action once per result id
      // within this Device API transaction
      this.messageContext.resultUpdated(resultId, deviceLogId)
    }
  }
}

exports.DeviceApiContext = DeviceApiContext

async function getHandlerOptionsFromRequest(
  handler,
  { auth = { credentials: {} }, type = {} },
  defaultHandlerOptions = {}
) {
  let partnerPluginName
  let deviceTypePluginName
  const {
    credentials: { token: deviceApiKeyToken },
  } = auth
  if (deviceApiKeyToken) {
    ;({ partnerPluginName, deviceTypePluginName } =
      (await knex
        .from('DeviceApiKey as dak')
        .leftJoin('Partner as dak_p', 'dak_p.id', 'dak.partnerId')
        .leftJoin('Device as dev', 'dev.id', 'dak.deviceId')
        .leftJoin('DeviceType as dt', 'dt.id', 'dev.deviceTypeId')
        .leftJoin('Partner as dev_p', 'dev_p.id', 'dev.partnerId')
        .where('dak.token', deviceApiKeyToken)
        .first(
          knex.raw('COALESCE(dev_p.plugin, dak_p.plugin) as partnerPluginName'),
          'dt.plugin as deviceTypePluginName'
        )) || {})
  }
  const { id: deviceTypeId } = type
  if (!deviceTypePluginName && deviceTypeId) {
    ;({ deviceTypePluginName } =
      (await knex
        .from('DeviceType as dt')
        .where('dt.externalId', deviceTypeId)
        .first('dt.plugin as deviceTypePluginName')) || {})
  }
  const handlerOptionGroups = await loadPlugin(partnerPluginName, deviceTypePluginName, 'handlerOptions')
  return _.merge({}, defaultHandlerOptions, handlerOptionGroups[handler.name] || {})
}

function createNewDeviceFromRequest(request, now) {
  return transact(async knex => {
    const { auth } = request
    logger.debug('Create new device from request', {
      reLabel: 'deviceApi:createNewDeviceFromRequest',
    })
    // Find API Key to use as template for new device
    const partnerApiKey = await knex('DeviceApiKey as k')
      .where({
        'k.token': auth.credentials.token,
        'k.revoked': false,
        'k.deviceId': null,
      })
      .leftJoin('Partner as p', 'p.id', 'k.partnerId')
      .first('k.id', 'k.partnerId', 'k.geographyId', 'k.siteId', 'p.plugin')
    if (!partnerApiKey) {
      return {
        error: Boom.notFound('Cannot find available API Key when creating new device'),
      }
    }
    const partnerPluginName = _.get(partnerApiKey, 'plugin')
    const deviceTypePluginName = await deviceTypeToPlugin(_.get(request, 'payload.type.id'))
    const apiKey = partnerApiKey

    // Require Device Type when creating device
    const transformNewDevicePayload = await loadPlugin(
      partnerPluginName,
      deviceTypePluginName,
      'transformNewDevicePayload'
    )
    const payload = await transformNewDevicePayload({
      payload: request.payload,
    })

    const preProcessCreateDevice = await loadPlugin(partnerPluginName, deviceTypePluginName, 'preProcessCreateDevice')
    const existingDevice = await preProcessCreateDevice(request, now)

    if (!_.isEmpty(existingDevice)) {
      return { device: existingDevice }
    }

    const deviceTypeExternalId = _.get(payload, 'type.id', null)
    if (!deviceTypeExternalId) {
      return {
        error: Boom.badRequest('Must specify device type on first request with new key'),
      }
    }

    const siteExternalId = _.get(payload, 'site.id', null)
    let defaultSite = {}
    logger.debug(siteExternalId && !apiKey.geographyId && !apiKey.siteId, {
      reLabel: 'deviceApi:createNewDevice',
    })
    if (siteExternalId && !apiKey.geographyId && !apiKey.siteId)
      defaultSite = await knex('Site as s').where('externalId', siteExternalId).first()

    const hostId = _.get(payload, 'configuration.data.hostId', null) || payload.hostId
    const serial = _.get(payload, 'configuration.data.deviceSerialNumber') || payload.serial
    const macAddress = _.get(payload, 'configuration.data.macAddress') || payload.macAddress

    const { device, error } = await createNewDevice(knex, now, {
      deviceTypeExternalId,
      name: payload.name,
      hostId: hostId || payload.name,
      serial,
      macAddress,
      partnerId: apiKey.partnerId,
      siteId: apiKey.siteId || _.get(defaultSite, 'id', null),
      approval: apiKey.siteId ? 'approved' : 'provisioned',
      timezone: _.get(payload, 'configuration.data.timezone', null),
    })
    logger.debug('Assign new device an api key', {
      reLabel: 'deviceApi:createNewDeviceFromRequest',
    })
    // Assign new device to API Key
    await knex('DeviceApiKey').where({ id: apiKey.id }).update({ deviceId: device.id, updatedOn: now })

    return { device, error }
  })
}

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
