const Boom = require('@hapi/boom')
const { transact } = require('../db')
const { getConstraints } = require('../auth/constraints')
const { deviceApprovalToId } = require('../shared/dictionary')
const {
  getSourceDevices,
  getTargetDevice,
  mergeIssuesFromDuplicatedResults,
  updateDeviceOnRemainingIssues,
  mergeNonRepeatedResults,
  getDevicesIdsCheckingConstraints,
} = require('./common/db')

const { deleteDevice } = require('./common/logic')

module.exports = async function ({ payload, auth }) {
  const devices = await getDevicesToMerge(payload)

  try {
    await validate(devices, auth.credentials)
  } catch (error) {
    if (error instanceof Boom.Boom) {
      return error
    }
    throw error
  }

  await transact(async trknex =>
    Promise.all(
      devices.sourceDevices.map(async sourceDevice =>
        mergeDevices({ sourceDevice, targetDevice: devices.targetDevice }, trknex)
      )
    )
  )
  return { ok: true }
}

async function mergeDevices(devicesToMerge, trknex) {
  await mergeIssuesFromDuplicatedResults(devicesToMerge, trknex)
  await updateDeviceOnRemainingIssues(devicesToMerge, trknex)
  await mergeNonRepeatedResults(devicesToMerge, trknex)
  await deleteDevice(devicesToMerge.sourceDevice.id, trknex)
}

async function getDevicesToMerge({ sourceDevicesIds, targetDeviceId }) {
  const sourceDevices = await getSourceDevices(sourceDevicesIds)
  const targetDevice = await getTargetDevice(targetDeviceId)
  return { sourceDevices, targetDevice }
}

const validate = async (devicesToMerge, credentials) => {
  await validatePersmissions(devicesToMerge, credentials)
  await validateDeviceIsNotActive(devicesToMerge.sourceDevices)
  await validateSameSite(devicesToMerge)
}

async function validatePersmissions(devicesToMerge, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const allDevicesIds = [...devicesToMerge.sourceDevices.map(d => d.id), devicesToMerge.targetDevice.id]

  const devices = await getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints)

  if (devices.length !== allDevicesIds.length) {
    throw Boom.forbidden(`You don't have permission to merge this devices.`)
  }
}

async function validateDeviceIsNotActive(sourceDevices) {
  const deviceApprovedId = await deviceApprovalToId('approved')

  if (sourceDevices.some(d => d.deviceApprovalId === deviceApprovedId)) {
    throw Boom.badData(`An active device cannot be merged. Change the approval status first.`)
  }
}

async function validateSameSite({ sourceDevices, targetDevice }) {
  if (sourceDevices.some(sourceDevice => sourceDevice.siteId !== targetDevice.siteId)) {
    throw Boom.badData('Cannot merge devices from different sites')
  }
}
