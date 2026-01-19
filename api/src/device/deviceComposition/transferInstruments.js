const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')

const { factGenerateResultCounts, factGenerateDeviceConnectivity } = require('../../fact/actions')
const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { getDevicesIdsCheckingConstraints } = require('../common/db')
const { executeMergeDevices: mergeDevice } = require('./mergeDevicesLogic')
const { transferDeviceInstruments } = require('./transferInstrumentsLogic')

async function transferInstruments({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)
  const { sourceInstrumentsIds, targetDeviceId } = payload

  const targetDevice = await getTargetDevice(targetDeviceId)
  const sourceInstruments = await getSourceInstruments(sourceInstrumentsIds)
  const sourceDeviceIds = getUniqueDeviceIds(sourceInstruments)

  await validate(sourceInstruments, sourceDeviceIds, targetDevice, auth.credentials)

  const sourceDeviceInstrumentCounts = await getDeviceInstrumentCounts(sourceDeviceIds)
  const instrumentsByDevice = groupInstrumentIdsByDevice(sourceInstruments)
  const devicesToFullyMerge = selectDevicesToFullyMerge(instrumentsByDevice, sourceDeviceInstrumentCounts)
  const devicesToPartiallyTransfer = sourceDeviceIds.filter(deviceId => !devicesToFullyMerge.has(deviceId))
  const sourceDevices = await getSourceDevices(sourceDeviceIds)
  const sourceDeviceMap = new Map(sourceDevices.map(sourceDevice => [sourceDevice.id, sourceDevice]))

  const { deletedDeviceIds } = await transact(async trknex => {
    await Promise.all(
      [...devicesToFullyMerge].map(deviceId => mergeDevice(trknex, sourceDeviceMap.get(deviceId), targetDevice, userId))
    )

    await Promise.all(
      devicesToPartiallyTransfer.map(deviceId =>
        transferDeviceInstruments(trknex, instrumentsByDevice.get(deviceId), targetDevice.id, userId)
      )
    )

    return { deletedDeviceIds: [...devicesToFullyMerge] }
  })

  await recalculateDeviceFactTables(messageContext, sourceDeviceIds, targetDevice.id, deletedDeviceIds)

  return { ok: true, deletedDeviceIds }
}

function getUniqueDeviceIds(sourceInstruments) {
  return [...new Set(sourceInstruments.map(sourceInstrument => sourceInstrument.deviceId))]
}

function groupInstrumentIdsByDevice(sourceInstruments) {
  const instrumentsByDevice = new Map()

  for (const sourceInstrument of sourceInstruments) {
    const deviceIds = instrumentsByDevice.get(sourceInstrument.deviceId) || []
    deviceIds.push(sourceInstrument.id)
    instrumentsByDevice.set(sourceInstrument.deviceId, deviceIds)
  }

  return instrumentsByDevice
}

function selectDevicesToFullyMerge(instrumentsByDevice, sourceDeviceInstrumentCounts) {
  const devicesToFullyMerge = new Set()

  for (const [deviceId, instrumentIds] of instrumentsByDevice.entries()) {
    const totalInstruments = sourceDeviceInstrumentCounts.get(deviceId) || 0
    const uniqueIdCount = new Set(instrumentIds).size

    if (totalInstruments === uniqueIdCount) {
      devicesToFullyMerge.add(deviceId)
    }
  }

  return devicesToFullyMerge
}

async function getTargetDevice(targetDeviceId) {
  return knex('Device as d').where('d.id', targetDeviceId).join('DeviceType as dt', 'd.deviceTypeId', 'dt.id').first({
    id: 'd.id',
    deviceApiKeyId: 'd.deviceApiKeyId',
    deviceTypeExternalId: 'dt.externalId',
  })
}

async function getSourceInstruments(sourceInstrumentsIds) {
  if (sourceInstrumentsIds.length === 0) {
    return []
  }

  const query = knex('Instrument as i')
    .join('Device as d', 'i.deviceId', 'd.id')
    .whereIn('i.id', sourceInstrumentsIds)
    .select({
      deviceId: 'd.id',
      id: 'i.id',
      serial: 'i.serial',
      deviceApiKeyId: 'd.deviceApiKeyId',
    })

  return query
}

async function getSourceDevices(sourceDeviceIds) {
  return knex('Device').whereIn('id', sourceDeviceIds).select('id', 'deviceApiKeyId')
}

async function getDeviceInstrumentCounts(sourceDeviceIds) {
  const rows = await knex('Instrument as i')
    .whereIn('i.deviceId', sourceDeviceIds)
    .groupBy('i.deviceId')
    .select('i.deviceId')
    .count({ instrumentCount: '*' })

  return new Map(rows.map(row => [row.deviceId, Number(row.instrumentCount)]))
}

async function recalculateDeviceFactTables(messageContext, sourceDeviceIds, targetDeviceId, deletedDeviceIds) {
  const eventContext = messageContext.bindActionCreators({ factGenerateResultCounts, factGenerateDeviceConnectivity })

  const deviceIdsToRecalculate = selectDevicesToRecalculate(sourceDeviceIds, targetDeviceId, deletedDeviceIds)

  for (const deviceId of deviceIdsToRecalculate) {
    // eslint-disable-next-line no-await-in-loop
    await eventContext.factGenerateResultCounts(deviceId)
    // eslint-disable-next-line no-await-in-loop
    await eventContext.factGenerateDeviceConnectivity(deviceId)
  }
}

async function validate(sourceInstruments, sourceDeviceIds, targetDevice, credentials) {
  validateSourceInstruments(sourceInstruments)
  validateTargetDeviceExists(targetDevice)
  validateDifferentDevices(sourceInstruments, targetDevice)
  validateTargetDeviceIsGeneXpert(targetDevice)
  await validateSameSite(sourceInstruments, targetDevice)
  await validatePersmissions(sourceDeviceIds, targetDevice, credentials)
}

function validateDifferentDevices(sourceInstruments, targetDevice) {
  const sourceDevices = sourceInstruments.map(sourceInstrument => ({ id: sourceInstrument.deviceId }))
  if (sourceDevices.some(sourceDevice => sourceDevice.id === targetDevice.id)) {
    throw Boom.badData("The target device is the same as the instrument's current device")
  }
}

function validateSourceInstruments(sourceInstruments) {
  if (!Array.isArray(sourceInstruments) || sourceInstruments.length === 0) {
    throw Boom.badData('No source instruments provided')
  }
}

function validateTargetDeviceExists(targetDevice) {
  if (!targetDevice || !targetDevice.id) {
    throw Boom.badData('Target device not found')
  }
}

function validateTargetDeviceIsGeneXpert(targetDevice) {
  if (targetDevice.deviceTypeExternalId !== 'CepheidGeneXpert') {
    throw Boom.badData('Target device must be a GeneXpert device')
  }
}

async function validateSameSite(sourceInstruments, targetDevice) {
  const deviceIds = [
    ...new Set([...sourceInstruments.map(sourceInstrument => sourceInstrument.deviceId), targetDevice.id]),
  ]
  const deviceSiteIds = await getDeviceSiteIds(deviceIds)
  const targetSiteId = deviceSiteIds.get(targetDevice.id)

  if (!targetSiteId) {
    return
  }

  const hasDifferentSite = deviceIds.some(deviceId => {
    if (deviceId === targetDevice.id) {
      return false
    }

    const deviceSiteId = deviceSiteIds.get(deviceId)
    return deviceSiteId ? deviceSiteId !== targetSiteId : false
  })

  if (hasDifferentSite) {
    throw Boom.badData('Cannot transfer instruments from different sites.')
  }
}

async function validatePersmissions(sourceDeviceIds, targetDevice, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const allDevicesIds = [...sourceDeviceIds, targetDevice.id]

  const devices = await getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints)

  if (devices.length !== allDevicesIds.length) {
    throw Boom.forbidden(`You don't have permission to transfer these instruments.`)
  }
}

async function getDeviceSiteIds(deviceIds) {
  const activeDeployments = await knex('Deployment')
    .whereIn('deviceId', deviceIds)
    .whereNull('end')
    .select('deviceId', 'siteId')

  const deviceSiteIds = new Map()

  for (const deployment of activeDeployments) {
    deviceSiteIds.set(deployment.deviceId, deployment.siteId)
  }

  return deviceSiteIds
}

function selectDevicesToRecalculate(sourceDeviceIds, targetDeviceId, deletedDeviceIds) {
  const deletedDeviceIdSet = new Set(deletedDeviceIds)
  const deviceIds = new Set([...sourceDeviceIds, targetDeviceId])
  return [...deviceIds].filter(deviceId => !deletedDeviceIdSet.has(deviceId))
}

module.exports = { transferInstruments }
