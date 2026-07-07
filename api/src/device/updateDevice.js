const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { getUser } = require('../auth/service')
const { resolveDeviceNameOnEdit } = require('./common/deviceNaming')
const { showDevice, getDeviceByRequest } = require('./service')
const { DECOMMISSIONED } = require('./common/deviceApprovalService')

async function updateDevice(request) {
  const {
    params,
    payload,
    auth: { credentials },
  } = request

  const { id: currentlyLoggedInUserId } = await getUser(credentials.name)

  // TODO: check permission
  const now = new Date()
  const device = await getDeviceByRequest(request)

  if (device.approvalToken === DECOMMISSIONED) {
    throw Boom.conflict('A decommissioned device cannot be edited')
  }

  const configurationData = _.assign({}, device.configurationData, payload.configurationData)

  if (payload.approvalToken && device.approvalToken !== payload.approvalToken) {
    throw Boom.badRequest('Device approval must be changed using the device approval workflow')
  }

  const { partnerPluginName, deviceTypePluginName } =
    (await knex('Device as d')
      .join('Partner as p', 'd.partnerId', 'p.id')
      .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
      .where('d.id', params.deviceId)
      .first('p.plugin as partnerPluginName', 'dt.plugin as deviceTypePluginName')) || {}

  const prevDeviceApprovalId = await knex('Device').where('id', params.deviceId).first('deviceApprovalId')

  const resolvedName = await resolveDeviceNameOnEdit({
    partnerPluginName,
    deviceTypePluginName,
    deviceId: params.deviceId,
    currentName: device.name,
    deviceType: device.deviceType,
    editedDevice: {
      moduleBayCapacity: payload.moduleBayCapacity,
      gx6cModulesCount: payload.gx6cModulesCount,
      gx10cModulesCount: payload.gx10cModulesCount,
    },
  })

  const updateFields = {
    siteId: payload.siteId || device.siteId,
    deviceApprovalId: device.deviceApprovalId,
    configurationData: JSON.stringify(configurationData),
    dailyTestCapacity: payload.dailyTestCapacity,
    moduleBayCapacity: payload.moduleBayCapacity,
    implementingPartnerId: payload.implementingPartnerId,
    gx6cModulesCount: payload.gx6cModulesCount,
    gx10cModulesCount: payload.gx10cModulesCount,
    notes: payload.notes,
    stickerInstrumentSerial: payload.stickerInstrumentSerial,
    instrumentModel: payload.instrumentModel,
    softwareType: payload.softwareType,
    isDaisyChained: payload.isDaisyChained,
    updatedOn: now,
    updatedBy: currentlyLoggedInUserId,
  }

  if (resolvedName != null) {
    if (resolvedName !== device.name) {
      updateFields.name = resolvedName
      updateFields.shortName = String(resolvedName).substr(0, 45)
    }
  } else {
    updateFields.name = payload.name
    updateFields.shortName = payload.shortName
  }

  const updatedCount = await knex('Device').where('id', params.deviceId).update(updateFields)

  if (prevDeviceApprovalId !== device.deviceApprovalId) {
    await knex('DeviceApprovalLog').insert({
      deviceId: params.deviceId,
      deviceApprovalId: device.deviceApprovalId,
      changedOn: now,
      createdOn: now,
      createdBy: currentlyLoggedInUserId,
    })
  }

  if (updatedCount !== 1) {
    return Boom.badRequest()
  }

  return showDevice(request)
}

module.exports = {
  updateDevice,
}
