const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')
const { getUser } = require('../../auth/service')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { transferDeviceInstruments } = require('./transferInstrumentsLogic')
const { recalculateDeviceFactTables } = require('../common/logic')
const { syncDeviceApprovalFromDeployments } = require('../common/deviceApprovalService')
const { assignGeneratedDeviceName } = require('../common/deviceNaming')

async function transferInstrumentToNewDevice({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)
  const { instrumentId, name, shortName, siteId } = payload
  const { sourceDevice } = await getSourceDevice(instrumentId)

  await validate(instrumentId, name, shortName, siteId, auth.credentials)

  const { deletedDeviceIds, newDeviceId } = await transact(async trknex => {
    const newDeviceId = await createNewDevice(trknex, sourceDevice, instrumentId, { name, shortName, siteId }, userId)

    const { deletedDeviceIds } = await transferDeviceInstruments(
      trknex,
      {
        groupedInstruments: [{ deviceId: sourceDevice.id, instrumentIds: [instrumentId] }],
        targetDeviceId: newDeviceId,
      },
      userId
    )
    return { deletedDeviceIds, newDeviceId }
  })

  const deviceIdsToRecalculate = deletedDeviceIds.length === 0 ? [sourceDevice.id, newDeviceId] : [newDeviceId]
  await recalculateDeviceFactTables(messageContext, deviceIdsToRecalculate)

  return { ok: true, deletedDeviceIds, newDeviceId }
}

async function validate(instrumentId, name, shortName, siteId, credentials) {
  await validatePermissions(instrumentId, credentials)
  await validateExistingDeviceNames(name, shortName)
  await validateSitePermissions(siteId, credentials)
}

async function validatePermissions() {
  // TODO: Implement this
}

async function validateExistingDeviceNames(name, shortName) {
  const existingDevice = await knex('Device')
    .where('name', name)
    .orWhere('shortName', shortName)
    .first('name', 'shortName')
  if (existingDevice) {
    if (existingDevice.name === name) {
      throw Boom.badRequest('Device with this name already exists', { errorKeyCode: 'deviceNameAlreadyExists' })
    }
    if (existingDevice.shortName === shortName) {
      throw Boom.badRequest('Device with this short name already exists', {
        errorKeyCode: 'deviceShortNameAlreadyExists',
      })
    }
  }
}

async function validateSitePermissions(siteId, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const site = await knex('Site as s')
    .where('s.id', siteId)
    .modify(addConstraints, dataConstraints, { site: 's' })
    .first('s.id')
  if (!site) {
    throw Boom.forbidden('You do not have permission to create a device in this site', {
      errorKeyCode: 'sitePermissionDenied',
    })
  }
}

async function getSourceDevice(instrumentId) {
  const data = await knex('Device as d')
    .join('Instrument as i', 'i.deviceId', 'd.id')
    .where('i.id', instrumentId)
    .first('d.id', 'd.partnerId', 'd.deviceTypeId', 'd.deviceApprovalId', 'd.deviceApiKeyId', 'd.culture', 'd.timezone')

  if (!data) {
    throw Boom.badRequest('Instrument not found')
  }

  return {
    sourceDevice: {
      id: data.id,
      partnerId: data.partnerId,
      deviceTypeId: data.deviceTypeId,
      deviceApprovalId: data.deviceApprovalId,
      deviceApiKeyId: data.deviceApiKeyId,
      culture: data.culture,
      timezone: data.timezone,
    },
  }
}

async function createNewDevice(trknex, sourceDevice, instrumentId, { name, shortName, siteId }, userId) {
  const now = new Date()

  // Get last used deviceApiKeyId for this instrument, or use sourceDevice's deviceApiKeyId
  // in case there is none results yet.
  const deviceApiKeyId = (await getLastDeviceApiKey(instrumentId)) || sourceDevice.deviceApiKeyId

  const [deviceId] = await trknex('Device').insert({
    partnerId: sourceDevice.partnerId,
    siteId,
    deviceTypeId: sourceDevice.deviceTypeId,
    moduleBayCapacity: 4, // Initial Module Bay Capacity is 4 because it's just one instrument.
    deviceApprovalId: sourceDevice.deviceApprovalId,
    // Temporary non-null placeholders; the real name is generated from the
    // device type acronym + id below (it depends on the auto-increment id).
    name: name || 'device',
    shortName: shortName || 'device',
    culture: sourceDevice.culture,
    timezone: sourceDevice.timezone,
    deviceApiKeyId,
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  })

  await assignGeneratedDeviceName(trknex, {
    deviceId,
    deviceTypeId: sourceDevice.deviceTypeId,
    partnerPluginName: null,
    deviceTypePluginName: null,
  })

  await trknex('Deployment').insert({
    deviceId,
    siteId,
    start: null,
    end: null,
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  })

  await syncDeviceApprovalFromDeployments(trknex, { deviceId, userId, now })

  return deviceId
}

const getLastDeviceApiKey = async instrumentId => {
  const { deviceApiKeyId } =
    (await knex('Result as r')
      .join('Instrument as i', qb => {
        qb.on('i.serial', 'r.instrumentSerial').andOn('i.deviceId', 'r.deviceId')
      })
      .join('Device as d', 'd.id', 'r.deviceId')
      .where('i.id', instrumentId)
      .whereNotNull('d.deviceApiKeyId')
      .orderBy('r.endedOn', 'desc')
      .first('d.deviceApiKeyId')) || {}

  return deviceApiKeyId
}

module.exports = { transferInstrumentToNewDevice }
