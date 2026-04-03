const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { getUser } = require('../auth/service')
const { showDevice, getDeviceByRequest } = require('./service')

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

  const configurationData = _.assign({}, device.configurationData, payload.configurationData)

  if (payload.approvalToken && device.approvalToken !== payload.approvalToken) {
    throw Boom.badRequest('Device approval must be changed using the device approval workflow')
  }

  const prevDeviceApprovalId = await knex('Device').where('id', params.deviceId).first('deviceApprovalId')

  // update item
  const updatedCount = await knex('Device')
    .where('id', params.deviceId)
    .update({
      siteId: payload.siteId || device.siteId,
      deviceApprovalId: device.deviceApprovalId,
      configurationData: JSON.stringify(configurationData),
      dailyTestCapacity: payload.dailyTestCapacity,
      moduleBayCapacity: payload.moduleBayCapacity,
      implementingPartnerId: payload.implementingPartnerId,
      gx6cModulesCount: payload.gx6cModulesCount,
      gx10cModulesCount: payload.gx10cModulesCount,
      name: payload.name,
      notes: payload.notes,
      shortName: payload.shortName,
      stickerInstrumentSerial: payload.stickerInstrumentSerial,
      instrumentModel: payload.instrumentModel,
      softwareType: payload.softwareType,
      isDaisyChained: payload.isDaisyChained,
      updatedOn: now,
      updatedBy: currentlyLoggedInUserId,
    })

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
