const Boom = require('@hapi/boom')
const { knex, transact } = require('../db')

const { factGenerateResultCounts, factGenerateDeviceConnectivity } = require('../fact/actions')
const { getUser } = require('../auth/service')
const { getConstraints } = require('../auth/constraints')
const { getDevicesIdsCheckingConstraints } = require('./common/db')

async function transferInstruments({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)
  const { sourceInstrumentSerials, targetDeviceId } = payload

  const targetDevice = await getTargetDevice(targetDeviceId)
  const sourceInstruments = await getSourceInstruments(sourceInstrumentSerials)

  await validate(sourceInstruments, targetDevice, auth.credentials)

  await transact(async trknex =>
    Promise.all(
      sourceInstruments.map(sourceInstrument => transferInstrument(trknex, sourceInstrument, targetDevice.id, userId))
    )
  )

  await recalculateDeviceFactTables(messageContext, sourceInstruments, targetDevice)

  return { ok: true }
}

async function transferInstrument(trknex, sourceInstrument, targetDeviceId, userId) {
  /* await trknex('Instrument')
    .where('serial', sourceInstrument.serial)
    .update({ deviceId: targetDeviceId, updatedOn: new Date(), updatedBy: userId }) */
}

async function getTargetDevice(targetDeviceId) {
  return knex('Device as d').where('d.id', targetDeviceId).join('DeviceType as dt', 'd.deviceTypeId', 'dt.id').first({
    id: 'd.id',
    siteId: 'd.siteId',
    deviceApiKeyId: 'd.deviceApiKeyId',
    deviceTypeExternalId: 'dt.externalId',
  })
}

async function getSourceInstruments(sourceInstrumentSerials) {
  const instruments = await knex('Instrument as i')
    .whereIn('i.serial', sourceInstrumentSerials)
    .join('Device as d', 'i.deviceId', 'd.id')
    .select({
      deviceId: 'd.id',
      siteId: 'd.siteId',
      serial: 'i.serial',
      deviceApiKeyId: 'd.deviceApiKeyId',
    })
  return instruments
}

async function recalculateDeviceFactTables(messageContext, sourceInstruments, targetDevice) {
  const eventContext = messageContext.bindActionCreators({ factGenerateResultCounts, factGenerateDeviceConnectivity })

  // Recalculate facts for each source device and the target device
  for (const sourceInstrument of sourceInstruments) {
    // eslint-disable-next-line no-await-in-loop
    await eventContext.factGenerateResultCounts(sourceInstrument.deviceId)
    // eslint-disable-next-line no-await-in-loop
    await eventContext.factGenerateDeviceConnectivity(sourceInstrument.deviceId)
  }

  await eventContext.factGenerateResultCounts(targetDevice.id)
  await eventContext.factGenerateDeviceConnectivity(targetDevice.id)
}

async function validate(sourceInstruments, targetDevice, credentials) {
  validateSourceInstruments(sourceInstruments)
  validateTargetDeviceExists(targetDevice)
  validateDifferentDevices(sourceInstruments, targetDevice)
  validateTargetDeviceIsGeneXpert(targetDevice)
  await validatePersmissions(sourceInstruments, targetDevice, credentials)
}

function validateDifferentDevices(sourceInstruments, targetDevice) {
  const sourceDevices = sourceInstruments.map(sourceInstrument => ({ id: sourceInstrument.deviceId }))
  if (sourceDevices.some(sourceDevice => sourceDevice.id === targetDevice.id)) {
    throw Boom.badData("The target device is the same as the instrument's current device")
  }
}

function validateSourceInstruments(sourceInstruments) {
  if (!Array.isArray(sourceInstruments) || sourceInstruments.length === 0) {
    throw Boom.badData('No source instrument serials provided')
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

async function validatePersmissions(sourceInstruments, targetDevice, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const allDevicesIds = [...sourceInstruments.map(sourceInstrument => sourceInstrument.deviceId), targetDevice.id]

  const devices = await getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints)

  if (devices.length !== allDevicesIds.length) {
    throw Boom.forbidden(`You don't have permission to transfer these instruments.`)
  }
}

module.exports = { transferInstruments }
