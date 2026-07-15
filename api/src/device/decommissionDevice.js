const Boom = require('@hapi/boom')
const { transact } = require('../db')
const { getUser } = require('../auth/service')
const { getConstraints } = require('../auth/constraints')
const { getDevicesIdsCheckingConstraints } = require('./common/db')
const { showDevice } = require('./service')
const {
  assertDeviceCanBeDecommissioned,
  decommissionDevice: saveDecommissionedDevice,
} = require('./common/deviceApprovalService')

async function decommissionDevice(request) {
  const {
    params: { deviceId },
    auth: { credentials },
  } = request

  const { id: userId } = await getUser(credentials.name)
  await validateDeviceAccess(deviceId, credentials)

  await transact(async trx => {
    await assertDeviceCanBeDecommissioned(trx, deviceId)
    await saveDecommissionedDevice(trx, { deviceId, userId })
  })

  return showDevice(request)
}

async function validateDeviceAccess(deviceId, credentials) {
  const dataConstraints = await getConstraints(credentials)
  const devices = await getDevicesIdsCheckingConstraints([deviceId], dataConstraints)

  if (devices.length !== 1) {
    throw Boom.forbidden("You don't have permission to update the requested device")
  }
}

module.exports = { decommissionDevice }
