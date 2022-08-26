const Boom = require('@hapi/boom')
const { transact } = require('../db')
const { getConstraints } = require('../auth/constraints')
const {
  getSourceDevices,
  getTargetDevice,
  mergeIssuesFromDuplicatedResults,
  mergeDeviceLevelIssues,
  mergeNonRepeatedResults,
  getDevicesIdsCheckingConstraints,
} = require('./common/db')

const { deleteDevice } = require('./common/logic')

module.exports = async function ({ payload, auth }) {
  const devices = await getDevicesToMerge(payload)

  await validate(devices, auth.credentials)

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
  await mergeDeviceLevelIssues(devicesToMerge, trknex)
  await mergeNonRepeatedResults(devicesToMerge, trknex)
  await deleteDevice(devicesToMerge.sourceDevice.id, trknex)
}

async function getDevicesToMerge({ sourceDevicesIds, targetDeviceId }) {
  const sourceDevices = await getSourceDevices(sourceDevicesIds)
  const targetDevice = await getTargetDevice(targetDeviceId)
  return { sourceDevices, targetDevice }
}

const validate = async (devicesToMerge, credentials) => {
  validateDifferentDevices(devicesToMerge)
  validateDeviceIsNotActive(devicesToMerge.sourceDevices)
  validateSameSite(devicesToMerge)
  validateDeviceType(devicesToMerge)
  await validatePersmissions(devicesToMerge, credentials)
}

async function validatePersmissions(devicesToMerge, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const allDevicesIds = [...devicesToMerge.sourceDevices.map(d => d.id), devicesToMerge.targetDevice.id]

  const devices = await getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints)

  if (devices.length !== allDevicesIds.length) {
    throw Boom.forbidden(`You don't have permission to merge this devices.`)
  }
}

function validateDeviceIsNotActive(sourceDevices) {
  if (sourceDevices.some(d => lessThan24HsFrom(d.lastPingOn))) {
    throw Boom.badData(
      `All devices to be merged must have been offline for at least 24 hours. Select only inactive devices and try again.`
    )
  }
}

function lessThan24HsFrom(lastPingOn) {
  return (new Date() - lastPingOn) / 1000 / 60 / 60 / 24 < 1
}

function validateDifferentDevices({ sourceDevices, targetDevice }) {
  if (sourceDevices.some(sourceDevice => sourceDevice.id === targetDevice.id)) {
    throw Boom.badData('Cannot merge a device into itself.')
  }
}

function validateSameSite({ sourceDevices, targetDevice }) {
  if (sourceDevices.some(sourceDevice => sourceDevice.siteId !== targetDevice.siteId)) {
    throw Boom.badData('Cannot merge devices from different sites.')
  }
}

function validateDeviceType({ sourceDevices, targetDevice }) {
  if (sourceDevices.some(sourceDevice => sourceDevice.deviceTypeId !== targetDevice.deviceTypeId)) {
    throw Boom.badData('Cannot merge different type of devices.')
  }
}
