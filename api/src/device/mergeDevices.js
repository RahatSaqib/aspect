const Boom = require('@hapi/boom')
const { knex, transact } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const { deleteDevice } = require('./common/logic')
const { factGenerateResultCounts, factGenerateDeviceConnectivity } = require('../fact/actions')
const { getUser } = require('../auth/service')

async function mergeDevices({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)
  const { sourceDevices, targetDevice } = await getDevicesToMerge(payload)

  await validate(sourceDevices, targetDevice, auth.credentials)

  await transact(async trknex =>
    Promise.all(sourceDevices.map(sourceDevice => mergeDevice(trknex, sourceDevice, targetDevice, userId)))
  )

  const eventContext = messageContext.bindActionCreators({ factGenerateResultCounts, factGenerateDeviceConnectivity })

  await eventContext.factGenerateResultCounts(targetDevice.id)
  await eventContext.factGenerateDeviceConnectivity(targetDevice.id)

  return { ok: true }
}

async function mergeDevice(trknex, sourceDevice, targetDevice, userId) {
  await mergeIssuesFromDuplicatedResults(trknex, sourceDevice, targetDevice)
  await mergeDeviceLevelIssues(trknex, sourceDevice, targetDevice)
  await mergeNonRepeatedResults(trknex, sourceDevice, targetDevice)
  await mergeMessages(trknex, sourceDevice, targetDevice)
  await mergeInstruments(trknex, sourceDevice, targetDevice)

  // Revoke DeviceApiKey if not used by target device
  if (sourceDevice.deviceApiKeyId && sourceDevice.deviceApiKeyId !== targetDevice.deviceApiKeyId) {
    await revokeDeviceApiKey(trknex, sourceDevice, userId)
  }

  await deleteDevice(sourceDevice.id, trknex)
}

async function revokeDeviceApiKey(trknex, sourceDevice, userId) {
  await trknex('DeviceApiKey')
    .where('id', sourceDevice.deviceApiKeyId)
    .update({ revoked: true, updatedOn: new Date(), updatedBy: userId, deviceId: null })
}

async function getDevicesToMerge({ sourceDevicesIds, targetDeviceId }) {
  const sourceDevices = await getSourceDevices(sourceDevicesIds)
  const targetDevice = await getTargetDevice(targetDeviceId)
  return { sourceDevices, targetDevice }
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

async function getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints) {
  return knex('Device as d')
    .whereIn('d.id', allDevicesIds)
    .join('Site as s', 'd.siteId', 's.id')
    .modify(addConstraints, dataConstraints, { site: 's' })
    .select('d.id')
}

// Merge instruments from source to target device
async function mergeInstruments(trknex, sourceDevice, targetDevice) {
  // Move all instruments from the source device to the target device
  await trknex('Instrument').where('deviceId', sourceDevice.id).update({ deviceId: targetDevice.id })
}

async function mergeIssuesFromDuplicatedResults(trknex, sourceDevice, targetDevice) {
  const sourceDeviceId = sourceDevice.id
  const targetDeviceId = targetDevice.id

  await trknex('Issue as i')
    .update('i.deviceId', targetDeviceId)
    .update('i.resultId', trknex.raw('pivot.targetResultId'))
    .join(
      knex('Result as sr')
        .join('Result as tr', 'sr.externalId', 'tr.externalId')
        .where('sr.deviceId', sourceDeviceId)
        .where('tr.deviceId', targetDeviceId)
        .select({ sourceResultId: 'sr.id', targetResultId: 'tr.id', externalId: 'sr.externalId' })
        .as('pivot'),
      'i.resultId',
      'pivot.sourceResultId'
    )
    .where('i.id', '>', 0)
}

async function mergeDeviceLevelIssues(trknex, sourceDevice, targetDevice) {
  const sourceDeviceId = sourceDevice.id
  const targetDeviceId = targetDevice.id

  await trknex('Issue').where('deviceId', sourceDeviceId).whereNull('resultId').update('deviceId', targetDeviceId)
}

async function mergeNonRepeatedResults(trknex, sourceDevice, targetDevice) {
  const sourceDeviceId = sourceDevice.id
  const targetDeviceId = targetDevice.id

  const repeatedResultsQuery = trknex(
    trknex('Result')
      .where('deviceID', targetDeviceId)
      .where('externalId', knex.raw(`sourceResults.externalId`))
      .select('externalId')
      .as('t')
  ).select('t.externalId')

  await trknex('Result as sourceResults')
    .where({ deviceId: sourceDeviceId })
    .whereNotIn('sourceResults.externalId', repeatedResultsQuery)
    .update('deviceId', targetDeviceId)

  await trknex('DeviceLog').where({ deviceId: sourceDeviceId }).update({ deviceId: targetDeviceId })
}

async function mergeMessages(trknex, sourceDevice, targetDevice) {
  const sourceDeviceId = sourceDevice.id
  const targetDeviceId = targetDevice.id

  const messagesToMergeFilter = qb =>
    qb
      .where({ deviceId: sourceDeviceId })
      .where(qb =>
        qb
          .whereIn('m.resultId', knex('Result as r').where('r.deviceId', targetDeviceId).select('id'))
          .orWhereNull('m.resultId')
      )

  await trknex('AlertMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('EmailMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('PushNotificationMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('SmsMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('WebhookMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
}

module.exports = { mergeDevices }
