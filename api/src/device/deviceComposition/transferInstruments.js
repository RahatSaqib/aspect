const _ = require('lodash')
const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')

const { recalculateDeviceFactTables } = require('../common/logic')
const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { getDevicesIdsCheckingConstraints } = require('../common/db')
const { transferDeviceInstruments } = require('./transferInstrumentsLogic')

async function transferInstruments({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)
  const { sourceInstrumentsIds, targetDeviceId } = payload

  const targetDevice = await getTargetDevice(targetDeviceId)
  const sourceInstruments = await getSourceInstruments(sourceInstrumentsIds)
  const sourceDeviceIds = getUniqueDeviceIds(sourceInstruments)

  await validate(sourceInstruments, sourceDeviceIds, targetDevice, auth.credentials)

  const { deletedDeviceIds } = await transact(async trknex =>
    transferDeviceInstruments(trknex, { sourceDeviceIds, sourceInstruments, targetDeviceId }, userId)
  )

  const sourceDeviceIdsToRecalculate = _.difference(sourceDeviceIds, deletedDeviceIds)
  await recalculateDeviceFactTables(messageContext, [...sourceDeviceIdsToRecalculate, targetDeviceId])

  return { ok: true, deletedDeviceIds }
}

function getUniqueDeviceIds(sourceInstruments) {
  return [...new Set(sourceInstruments.map(sourceInstrument => sourceInstrument.deviceId))]
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

async function validate(sourceInstruments, sourceDeviceIds, targetDevice, credentials) {
  validateSourceInstruments(sourceInstruments)
  validateTargetDeviceExists(targetDevice)
  validateDifferentDevices(sourceInstruments, targetDevice)
  validateTargetDeviceIsGeneXpert(targetDevice)
  await validatePersmissions(sourceDeviceIds, targetDevice, credentials)
}

function validateDifferentDevices(sourceInstruments, targetDevice) {
  const sourceDevices = sourceInstruments.map(sourceInstrument => ({ id: sourceInstrument.deviceId }))
  if (sourceDevices.some(sourceDevice => sourceDevice.id === targetDevice.id)) {
    throw Boom.badRequest("The target device is the same as the instrument's current device", {
      errorKeyCode: 'targetDeviceIsSourceDevice',
    })
  }
}

function validateSourceInstruments(sourceInstruments) {
  if (!Array.isArray(sourceInstruments) || sourceInstruments.length === 0) {
    throw Boom.badRequest('No source instruments provided')
  }
}

function validateTargetDeviceExists(targetDevice) {
  if (!targetDevice || !targetDevice.id) {
    throw Boom.badRequest('Target device not found')
  }
}

function validateTargetDeviceIsGeneXpert(targetDevice) {
  if (targetDevice.deviceTypeExternalId !== 'CepheidGeneXpert') {
    throw Boom.badRequest('Target device must be a GeneXpert device')
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

module.exports = { transferInstruments }
