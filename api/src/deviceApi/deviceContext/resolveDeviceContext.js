const Boom = require('@hapi/boom')
const _ = require('lodash')
const { knex } = require('../../db')
const { getUser } = require('../../auth/service')
const {
  resultUpdated,
  types: { RESULT_UPDATED },
} = require('../../result/actions')
const { loadPlugin } = require('../../plugin/loadPlugin')
const logger = require('../../shared/logger')
const { DEVICE_LOG_TYPE_NONE, DEVICE_LOG_TYPE_RESULT, DEVICE_LOG_TYPE_OPERATION } = require('../constants')
const { resolveDevice } = require('./deviceIdentification')
const { createNewDevice } = require('./deviceCreation')
const { sendNotificationToContacts } = require('./deviceNotifications')
const { notifyResultUpdated } = require('./contextHelpers')

/**
 * Gets handler options from the request, loading plugin-specific options.
 *
 * @param {Function} handler - The handler function
 * @param {Object} request - Request object with auth and payload
 * @param {Object} defaultHandlerOptions - Default options to merge with
 * @returns {Promise<Object>} Merged handler options
 */
async function getHandlerOptionsFromRequest(handler, request, defaultHandlerOptions = {}) {
  let partnerPluginName
  let deviceTypePluginName
  const {
    auth = { credentials: {} },
    payload: { type = {} },
  } = request
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

/**
 * Resolves a device and builds the device API context object.
 * This is the main entry point that replaces DeviceApiContext.createDeviceApiContext.
 *
 * @param {Function} handler - The handler function (for getting handler options)
 * @param {Object} originalRequest - The original Hapi request object
 * @param {Object} defaultHandlerOptions - Default handler options
 * @returns {Promise<{context: Object, error: Object|null}>} Context object and optional error
 */
async function resolveDeviceContext(handler, originalRequest, defaultHandlerOptions) {
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

  // Get plugin names for device resolution
  let partnerPluginName
  let deviceTypePluginName
  if (auth.credentials.token) {
    ;({ partnerPluginName, deviceTypePluginName } =
      (await knex
        .from('DeviceApiKey as dak')
        .leftJoin('Partner as dak_p', 'dak_p.id', 'dak.partnerId')
        .leftJoin('Device as dev', 'dev.id', 'dak.deviceId')
        .leftJoin('DeviceType as dt', 'dt.id', 'dev.deviceTypeId')
        .leftJoin('Partner as dev_p', 'dev_p.id', 'dev.partnerId')
        .where('dak.token', auth.credentials.token)
        .first(
          knex.raw('COALESCE(dev_p.plugin, dak_p.plugin) as partnerPluginName'),
          'dt.plugin as deviceTypePluginName'
        )) || {})
  }
  const { id: deviceTypeId } = _.get(request, 'payload.type', {})
  if (!deviceTypePluginName && deviceTypeId) {
    ;({ deviceTypePluginName } =
      (await knex
        .from('DeviceType as dt')
        .where('dt.externalId', deviceTypeId)
        .first('dt.plugin as deviceTypePluginName')) || {})
  }

  // Try to resolve device (plugin first, then standard lookup)
  let device = await resolveDevice(request, knex, partnerPluginName, deviceTypePluginName)

  // If device not found and creation is enabled, try to create it
  if (!device && createDevice) {
    const resolveDevicePlugin = await loadPlugin(partnerPluginName, deviceTypePluginName, 'resolveDevicePlugin')

    if (resolveDevicePlugin && resolveDevicePlugin.createDevice) {
      logger.debug('Using resolveDevicePlugin.createDevice', {
        reLabel: 'deviceApi:resolveDeviceContext',
      })
      const deviceAndError = await resolveDevicePlugin.createDevice(request, now)
      if (deviceAndError.error) {
        return deviceAndError
      }
      device = deviceAndError.device
    } else {
      logger.debug('Using fallback createNewDevice', {
        reLabel: 'deviceApi:resolveDeviceContext',
      })
      const deviceAndError = await createNewDevice(request, now)
      if (deviceAndError.error) {
        return deviceAndError
      }
      device = deviceAndError.device

      await sendNotificationToContacts(originalRequest.payload, device)
    }
  }

  if (!device) {
    // Trying to retrieve data for Device that has
    // none uploaded yet, but we have authorized the token
    return { error: Boom.notFound('No device found') }
  }

  // Get partner information
  const partner = await knex('Partner as p')
    .innerJoin('Device as d', 'd.partnerId', 'p.id')
    .where({ 'd.id': device.id })
    .first('p.id', 'p.deviceLogHistoryDays', 'p.plugin as partnerPluginName')
  if (!partner) {
    return { error: Boom.internal('Device not assigned to partner') }
  }

  // Get user ID
  let { id: userId } = (await getUser(auth.credentials.name)) || {}
  if (!userId) {
    ;({ createdBy: userId } = await knex('Device').where('id', device.id).first('createdBy'))
  }

  // Build context object (plain object, not class)
  const context = {
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
    actions: {
      resultUpdated: (resultId, deviceLogId) => notifyResultUpdated(context, resultId, deviceLogId),
    },
  }

  // Add Device Log if requested
  if (deviceLogType !== DEVICE_LOG_TYPE_NONE) {
    const { resultId } = request.query

    // We will only have a device log if we already had a device
    if (!device) {
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

module.exports = {
  resolveDeviceContext,
  getHandlerOptionsFromRequest,
}
