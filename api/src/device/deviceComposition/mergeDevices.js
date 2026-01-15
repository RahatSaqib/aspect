const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')
const { getConstraints } = require('../../auth/constraints')

const { factGenerateResultCounts, factGenerateDeviceConnectivity } = require('../../fact/actions')
const { getUser } = require('../../auth/service')
const { getDevicesIdsCheckingConstraints } = require('../common/db')
const { executeMergeDevices } = require('./logic')

async function mergeDevices({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)

  const sourceDevices = await getSourceDevices(payload.sourceDevicesIds)
  const targetDevice = await getTargetDevice(payload.targetDeviceId)

  await validate(sourceDevices, targetDevice, auth.credentials)

  await transact(async trknex =>
    Promise.all(sourceDevices.map(sourceDevice => executeMergeDevices(trknex, sourceDevice, targetDevice, userId)))
  )

  const eventContext = messageContext.bindActionCreators({ factGenerateResultCounts, factGenerateDeviceConnectivity })

  await eventContext.factGenerateResultCounts(targetDevice.id)
  await eventContext.factGenerateDeviceConnectivity(targetDevice.id)

  return { ok: true }
}

const validate = async (sourceDevices, targetDevice, credentials) => {
  validateDifferentDevices(sourceDevices, targetDevice)
  validateDeviceIsNotActive(sourceDevices)
  validateSameSite(sourceDevices, targetDevice)
  validateDeviceType(sourceDevices, targetDevice)
  await validatePersmissions(sourceDevices, targetDevice, credentials)
}

async function validatePersmissions(sourceDevices, targetDevice, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const allDevicesIds = [...sourceDevices.map(d => d.id), targetDevice.id]

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

function validateDifferentDevices(sourceDevices, targetDevice) {
  if (sourceDevices.some(sourceDevice => sourceDevice.id === targetDevice.id)) {
    throw Boom.badData('Cannot merge a device into itself.')
  }
}

function validateSameSite(sourceDevices, targetDevice) {
  if (sourceDevices.some(sourceDevice => sourceDevice.siteId !== targetDevice.siteId)) {
    throw Boom.badData('Cannot merge devices from different sites.')
  }
}

function validateDeviceType(sourceDevices, targetDevice) {
  if (sourceDevices.some(sourceDevice => sourceDevice.deviceTypeId !== targetDevice.deviceTypeId)) {
    throw Boom.badData('Cannot merge different type of devices.')
  }
}

async function getSourceDevices(sourceDevicesIds) {
  return knex('Device')
    .whereIn('id', sourceDevicesIds)
    .select('id', 'lastPingOn', 'siteId', 'deviceTypeId', 'deviceApiKeyId')
}

async function getTargetDevice(targetDeviceId) {
  return knex('Device').where('id', targetDeviceId).first('id', 'siteId', 'deviceTypeId', 'deviceApiKeyId')
}

module.exports = { mergeDevices }
