const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')
const { getUser } = require('../../auth/service')
const { getConstraints, addConstraints } = require('../../auth/constraints')
const { transferDeviceInstruments } = require('./transferInstrumentsLogic')

async function transferInstrumentToNewDevice({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)
  const { instrumentSerial, name, shortName, siteId } = payload
  const sourceDevice = await getSourceDevice(instrumentSerial)
  await validate(instrumentSerial, name, shortName, siteId, auth.credentials)
  await transact(async trknex => {
    const newDeviceId = await createNewDevice(
      trknex,
      sourceDevice,
      instrumentSerial,
      { name, shortName, siteId },
      userId
    )

    await transferDeviceInstruments(trknex, {
      sourceDeviceId: sourceDevice.id,
      targetDeviceId: newDeviceId,
      instrumentSerials: [instrumentSerial],
      userId,
    })
  })

  return { ok: true }
}

async function validate(instrumentSerial, name, shortName, siteId, credentials) {
  await validatePermissions(instrumentSerial, credentials)
  await validateExistingDeviceNames(name, shortName)
  await validateSitePermissions(siteId, credentials)
}

async function validatePermissions(instrumentSerial, credentials) {
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

async function getSourceDevice(instrumentSerial) {
  return knex('Device as d')
    .join('Instrument as i', 'i.deviceId', 'd.id')
    .where('i.serial', instrumentSerial)
    .first('d.id', 'd.partnerId', 'd.deviceTypeId', 'd.deviceApprovalId', 'd.culture', 'd.timezone')
}

async function createNewDevice(trknex, sourceDevice, instrumentSerial, { name, shortName, siteId }, userId) {
  const now = new Date()

  // Get last used deviceApiKeyId for this instrumentSerial, or use sourceDevice's deviceApiKeyId in case there is none results yet.
  const deviceApiKeyId = (await getLastDeviceApiKey(sourceDevice.id, instrumentSerial)) || sourceDevice.deviceApiKeyId

  const [deviceId] = await trknex('Device').insert({
    partnerId: sourceDevice.partnerId,
    siteId,
    deviceTypeId: sourceDevice.deviceTypeId,
    moduleBayCapacity: 4, // Initial Module Bay Capacity is 4 because it's just one instrument.
    deviceApprovalId: sourceDevice.deviceApprovalId,
    name,
    shortName,
    culture: sourceDevice.culture,
    timezone: sourceDevice.timezone,
    deviceApiKeyId,
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  })

  await trknex('DeviceApprovalLog').insert({
    deviceId,
    deviceApprovalId: sourceDevice.deviceApprovalId,
    changedOn: now,
    createdOn: now,
    createdBy: userId,
  })

  await trknex('Deployment').insert({
    deviceId,
    siteId,
    start: now,
    createdOn: now,
    createdBy: userId,
    updatedOn: now,
    updatedBy: userId,
  })

  return deviceId
}

const getLastDeviceApiKey = async (sourceDeviceId, instrumentSerial) => {
  const { deviceApiKeyId } =
    (await knex('Result')
      .where('deviceId', sourceDeviceId)
      .where('instrumentSerial', instrumentSerial)
      .orderBy('endedOn', 'desc')
      .first('deviceApiKeyId')) || {}

  return deviceApiKeyId
}

module.exports = { transferInstrumentToNewDevice }
