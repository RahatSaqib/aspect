const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex } = require('../db')
const { getUser } = require('../auth/service')
const { deviceApprovalToId } = require('../shared/dictionary')
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

  let { deviceApprovalId } = device
  // check if a approvalToken is provided
  if (_.has(payload, 'approvalToken') && device.approvalToken !== payload.approvalToken) {
    deviceApprovalId = await deviceApprovalToId(payload.approvalToken)
  }

  const prevDeviceApprovalId = await knex('Device').where('id', params.deviceId).first('deviceApprovalId')

  // update item
  const updatedCount = await knex('Device')
    .where('id', params.deviceId)
    .update({
      siteId: payload.siteId || device.siteId,
      deviceApprovalId,
      configurationData: JSON.stringify(configurationData),
      deviceCapacityId: payload.deviceCapacityId,
      name: payload.name,
      notes: payload.notes,
      shortName: payload.shortName,
      updatedOn: now,
      updatedBy: currentlyLoggedInUserId,
    })

  if (prevDeviceApprovalId !== deviceApprovalId) {
    await knex('DeviceApprovalLog').insert({
      deviceId: params.deviceId,
      deviceApprovalId,
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
