const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')
const { getConstraints } = require('../../auth/constraints')

const { recalculateDeviceFactTables } = require('../common/logic')
const { getUser } = require('../../auth/service')
const { getDevicesIdsCheckingConstraints } = require('../common/db')
const { executeMergeDevices } = require('./mergeDevicesLogic')

async function mergeDevices({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)

  const sourceDevices = await getSourceDevices(payload.sourceDevicesIds)
  const targetDevice = await getTargetDevice(payload.targetDeviceId)

  await validate(sourceDevices, targetDevice, auth.credentials)

  await transact(async trknex =>
    Promise.all(
      sourceDevices.map(sourceDevice => executeMergeDevices(trknex, sourceDevice.id, targetDevice.id, userId))
    )
  )

  await recalculateDeviceFactTables(messageContext, [targetDevice.id])

  return { ok: true }
}

const validate = async (sourceDevices, targetDevice, credentials) => {
  validateDifferentDevices(sourceDevices, targetDevice)
  validateDeviceIsNotActive(sourceDevices)
  validateSameSite(sourceDevices, targetDevice)
  validateDeviceType(sourceDevices, targetDevice)
  await validateInstruments(sourceDevices, targetDevice)
  await validatePersmissions(sourceDevices, targetDevice, credentials)
}

async function validatePersmissions(sourceDevices, targetDevice, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const allDevicesIds = [...sourceDevices.map(d => d.id), targetDevice.id]

  const devices = await getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints)

  if (devices.length !== allDevicesIds.length) {
    throw Boom.forbidden(`You don't have permission to merge this devices.`, {
      errorKeyCode: 'mergeDevicesPermissionDenied',
    })
  }
}

function validateDeviceIsNotActive(sourceDevices) {
  if (sourceDevices.some(d => lessThan24HsFrom(d.lastPingOn))) {
    throw Boom.badData(
      `All devices to be merged must have been offline for at least 24 hours. Select only inactive devices and try again.`,
      {
        errorKeyCode: 'mergeDevicesSourceDevicesStillActive',
      }
    )
  }
}

function lessThan24HsFrom(lastPingOn) {
  return (new Date() - lastPingOn) / 1000 / 60 / 60 / 24 < 1
}

function validateDifferentDevices(sourceDevices, targetDevice) {
  if (sourceDevices.some(sourceDevice => sourceDevice.id === targetDevice.id)) {
    throw Boom.badData('Cannot merge a device into itself.', {
      errorKeyCode: 'mergeDevicesTargetIsSourceDevice',
    })
  }
}

function validateSameSite(sourceDevices, targetDevice) {
  if (sourceDevices.some(sourceDevice => sourceDevice.siteId !== targetDevice.siteId)) {
    throw Boom.badData('Cannot merge devices from different sites.', {
      errorKeyCode: 'mergeDevicesDifferentSites',
    })
  }
}

function validateDeviceType(sourceDevices, targetDevice) {
  if (sourceDevices.some(sourceDevice => sourceDevice.deviceTypeId !== targetDevice.deviceTypeId)) {
    throw Boom.badData('Cannot merge different type of devices.', {
      errorKeyCode: 'mergeDevicesDifferentDeviceTypes',
    })
  }
}

async function validateInstruments(sourceDevices, targetDevice) {
  const deviceIds = [...sourceDevices.map(sourceDevice => sourceDevice.id), targetDevice.id]
  const serials = await knex('Instrument').whereIn('deviceId', deviceIds).pluck('serial')
  const [{ count: serialCounts }] = await knex('Instrument').whereIn('serial', serials).count('* as count')
  const hasDuplicateSerials = serials.length !== serialCounts

  if (hasDuplicateSerials) {
    throw Boom.badData('Cannot merge devices with duplicated instruments.', {
      errorKeyCode: 'mergeDevicesDuplicatedInstruments',
    })
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
