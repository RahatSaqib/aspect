const Boom = require('@hapi/boom')
const { transact } = require('../db')
const { getUser } = require('../auth/service')
const { getConstraints } = require('../auth/constraints')
const { getDevicesIdsCheckingConstraints } = require('./common/db')
const { showDevice } = require('./service')
const { decommissionDevice, reactivateDevice } = require('./common/deviceApprovalService')

async function updateDeviceApproval(request) {
  const {
    params: { deviceId },
    payload: { action },
    auth: { credentials },
  } = request

  const { id: userId } = await getUser(credentials.name)
  await validatePermissions(deviceId, credentials)

  await transact(async trx => {
    if (action === 'decommission') {
      await decommissionDevice(trx, { deviceId, userId })
      return
    }

    if (action === 'reactivate') {
      await reactivateDevice(trx, { deviceId, userId })
      return
    }

    throw Boom.badRequest('Unsupported device approval action')
  })

  return showDevice(request)
}

async function validatePermissions(deviceId, credentials) {
  const dataConstraints = await getConstraints(credentials)
  const devices = await getDevicesIdsCheckingConstraints([deviceId], dataConstraints)

  if (devices.length !== 1) {
    throw Boom.forbidden("You don't have permission to update the requested device")
  }
}

module.exports = { updateDeviceApproval }
