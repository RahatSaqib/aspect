const Boom = require('@hapi/boom')
const { knex, transact } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')

const { deleteDevice } = require('./common/logic')
const { factGenerateResultCounts, factGenerateDeviceConnectivity } = require('../fact/actions')

async function mergeDevices({ payload, plugins: { messageContext }, auth }) {
  const devices = await getDevicesToMerge(payload)

  await validate(devices, auth.credentials)

  await transact(async trknex =>
    Promise.all(
      devices.sourceDevices.map(async sourceDevice =>
        mergeDevice({ sourceDevice, targetDevice: devices.targetDevice }, trknex)
      )
    )
  )

  const eventContext = messageContext.bindActionCreators({ factGenerateResultCounts, factGenerateDeviceConnectivity })

  await eventContext.factGenerateResultCounts(devices.targetDevice.id)
  await eventContext.factGenerateDeviceConnectivity(devices.targetDevice.id)

  return { ok: true }
}

async function mergeDevice(devicesToMerge, trknex) {
  await mergeIssuesFromDuplicatedResults(devicesToMerge, trknex)
  await mergeDeviceLevelIssues(devicesToMerge, trknex)
  await mergeNonRepeatedResults(devicesToMerge, trknex)
  await mergeMessages(devicesToMerge, trknex)
  await mergeInstruments(devicesToMerge, trknex)
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

async function getSourceDevices(sourceDevicesIds) {
  return knex('Device').whereIn('id', sourceDevicesIds).select('id', 'lastPingOn', 'siteId', 'deviceTypeId')
}

async function getTargetDevice(targetDeviceId) {
  return knex('Device').where('id', targetDeviceId).first('id', 'siteId', 'deviceTypeId')
}

async function getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints) {
  return knex('Device as d')
    .whereIn('d.id', allDevicesIds)
    .join('Site as s', 'd.siteId', 's.id')
    .modify(addConstraints, dataConstraints, { site: 's' })
    .select('d.id')
}

// Merge instruments from source to target device
async function mergeInstruments(devicesToMerge, trknex) {
  // Move all instruments from the source device to the target device
  await trknex('Instrument')
    .where('deviceId', devicesToMerge.sourceDevice.id)
    .update({ deviceId: devicesToMerge.targetDevice.id })
}

async function mergeIssuesFromDuplicatedResults(devicesToMerge, trknex) {
  const {
    sourceDevice: { id: sourceDeviceId },
    targetDevice: { id: targetDeviceId },
  } = devicesToMerge

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

async function mergeDeviceLevelIssues(devicesToMerge, trknex) {
  const {
    sourceDevice: { id: sourceDeviceId },
    targetDevice: { id: targetDeviceId },
  } = devicesToMerge

  await trknex('Issue').where('deviceId', sourceDeviceId).whereNull('resultId').update('deviceId', targetDeviceId)
}

async function mergeNonRepeatedResults(devicesToMerge, trknex) {
  const {
    sourceDevice: { id: sourceDeviceId },
    targetDevice: { id: targetDeviceId },
  } = devicesToMerge

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

async function mergeMessages(devicesToMerge, trknex) {
  const {
    sourceDevice: { id: sourceDeviceId },
    targetDevice: { id: targetDeviceId },
  } = devicesToMerge

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
