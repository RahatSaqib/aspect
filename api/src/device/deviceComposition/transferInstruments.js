const Boom = require('@hapi/boom')
const { knex, transact } = require('../../db')

const { factGenerateResultCounts, factGenerateDeviceConnectivity } = require('../../fact/actions')
const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { getDevicesIdsCheckingConstraints } = require('../common/db')
const { executeMergeDevices: mergeDevice } = require('./deviceCompositionService')

async function transferInstruments({ payload, plugins: { messageContext }, auth }) {
  const { id: userId } = await getUser(auth.credentials.name)
  const { sourceInstrumentSerials, targetDeviceId } = payload

  const uniqueInstrumentSerials = [...new Set(sourceInstrumentSerials)]

  const targetDevice = await getTargetDevice(targetDeviceId)
  const sourceInstruments = await getSourceInstruments(uniqueInstrumentSerials)

  await validate(sourceInstruments, targetDevice, auth.credentials)

  const sourceDeviceIds = getUniqueDeviceIds(sourceInstruments)
  const sourceDeviceInstrumentCounts = await getDeviceInstrumentCounts(sourceDeviceIds)
  const instrumentsByDevice = groupInstrumentSerialsByDevice(sourceInstruments)
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
        transferDeviceInstruments(trknex, {
          sourceDeviceId: deviceId,
          targetDeviceId: targetDevice.id,
          instrumentSerials: instrumentsByDevice.get(deviceId),
          userId,
        })
      )
    )

    return { deletedDeviceIds: [...devicesToFullyMerge] }
  })

  await recalculateDeviceFactTables(messageContext, sourceDeviceIds, targetDevice.id, deletedDeviceIds)

  return { ok: true }
}

function getUniqueDeviceIds(sourceInstruments) {
  return [...new Set(sourceInstruments.map(sourceInstrument => sourceInstrument.deviceId))]
}

function groupInstrumentSerialsByDevice(sourceInstruments) {
  const instrumentsByDevice = new Map()

  for (const sourceInstrument of sourceInstruments) {
    const deviceSerials = instrumentsByDevice.get(sourceInstrument.deviceId) || []
    deviceSerials.push(sourceInstrument.serial)
    instrumentsByDevice.set(sourceInstrument.deviceId, deviceSerials)
  }

  return instrumentsByDevice
}

function selectDevicesToFullyMerge(instrumentsByDevice, sourceDeviceInstrumentCounts) {
  const devicesToFullyMerge = new Set()

  for (const [deviceId, instrumentSerials] of instrumentsByDevice.entries()) {
    const totalInstruments = sourceDeviceInstrumentCounts.get(deviceId) || 0
    const uniqueSerialCount = new Set(instrumentSerials).size

    if (totalInstruments === uniqueSerialCount) {
      devicesToFullyMerge.add(deviceId)
    }
  }

  return devicesToFullyMerge
}

async function transferDeviceInstruments(trknex, { sourceDeviceId, targetDeviceId, instrumentSerials, userId }) {
  await mergeIssuesFromDuplicatedResultsForInstruments(trknex, sourceDeviceId, targetDeviceId, instrumentSerials)
  await mergeNonRepeatedResultsForInstruments(trknex, sourceDeviceId, targetDeviceId, instrumentSerials)
  await mergeDeviceLogsForInstruments(trknex, sourceDeviceId, targetDeviceId, instrumentSerials)
  await mergeMessagesForInstruments(trknex, sourceDeviceId, targetDeviceId, instrumentSerials)
  await transferInstrumentSerials(trknex, sourceDeviceId, targetDeviceId, instrumentSerials, userId)
}

async function transferInstrumentSerials(trknex, sourceDeviceId, targetDeviceId, instrumentSerials, userId) {
  await trknex('Instrument')
    .where('deviceId', sourceDeviceId)
    .whereIn('serial', instrumentSerials)
    .update({ deviceId: targetDeviceId, updatedOn: new Date(), updatedBy: userId })
}

async function mergeIssuesFromDuplicatedResultsForInstruments(
  trknex,
  sourceDeviceId,
  targetDeviceId,
  instrumentSerials
) {
  await trknex('Issue as i')
    .update('i.deviceId', targetDeviceId)
    .update('i.resultId', trknex.raw('pivot.targetResultId'))
    .join(
      knex('Result as sr')
        .join('Result as tr', 'sr.externalId', 'tr.externalId')
        .where('sr.deviceId', sourceDeviceId)
        .whereIn('sr.instrumentSerial', instrumentSerials)
        .where('tr.deviceId', targetDeviceId)
        .select({ sourceResultId: 'sr.id', targetResultId: 'tr.id', externalId: 'sr.externalId' })
        .as('pivot'),
      'i.resultId',
      'pivot.sourceResultId'
    )
    .where('i.id', '>', 0)
}

async function mergeNonRepeatedResultsForInstruments(trknex, sourceDeviceId, targetDeviceId, instrumentSerials) {
  const repeatedResultsQuery = trknex(
    trknex('Result')
      .where('deviceID', targetDeviceId)
      .where('externalId', knex.raw(`sourceResults.externalId`))
      .select('externalId')
      .as('t')
  ).select('t.externalId')

  await trknex('Result as sourceResults')
    .where({ deviceId: sourceDeviceId })
    .whereIn('sourceResults.instrumentSerial', instrumentSerials)
    .whereNotIn('sourceResults.externalId', repeatedResultsQuery)
    .update('deviceId', targetDeviceId)
}

async function mergeDeviceLogsForInstruments(trknex, sourceDeviceId, targetDeviceId, instrumentSerials) {
  await trknex('DeviceLog')
    .where({ deviceId: sourceDeviceId })
    .whereIn(
      'resultId',
      trknex('Result as r')
        .where('r.deviceId', targetDeviceId)
        .whereIn('r.instrumentSerial', instrumentSerials)
        .select('r.id')
    )
    .update({ deviceId: targetDeviceId })
}

async function mergeMessagesForInstruments(trknex, sourceDeviceId, targetDeviceId, instrumentSerials) {
  const messagesToMergeFilter = qb =>
    qb
      .where({ deviceId: sourceDeviceId })
      .whereIn(
        'm.resultId',
        knex('Result as r')
          .where('r.deviceId', targetDeviceId)
          .whereIn('r.instrumentSerial', instrumentSerials)
          .select('id')
      )

  await trknex('AlertMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('EmailMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('PushNotificationMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('SmsMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('WebhookMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
}

async function getTargetDevice(targetDeviceId) {
  return knex('Device as d').where('d.id', targetDeviceId).join('DeviceType as dt', 'd.deviceTypeId', 'dt.id').first({
    id: 'd.id',
    deviceApiKeyId: 'd.deviceApiKeyId',
    deviceTypeExternalId: 'dt.externalId',
  })
}

async function getSourceInstruments(sourceInstrumentSerials) {
  return knex('Instrument as i')
    .whereIn('i.serial', sourceInstrumentSerials)
    .join('Device as d', 'i.deviceId', 'd.id')
    .select({
      deviceId: 'd.id',
      serial: 'i.serial',
      deviceApiKeyId: 'd.deviceApiKeyId',
    })
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

async function validate(sourceInstruments, targetDevice, credentials) {
  validateSourceInstruments(sourceInstruments)
  validateTargetDeviceExists(targetDevice)
  validateDifferentDevices(sourceInstruments, targetDevice)
  validateTargetDeviceIsGeneXpert(targetDevice)
  await validateSameSite(sourceInstruments, targetDevice)
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

async function validatePersmissions(sourceInstruments, targetDevice, credentials) {
  const dataConstraints = await getConstraints(credentials)

  const allDevicesIds = [...sourceInstruments.map(sourceInstrument => sourceInstrument.deviceId), targetDevice.id]

  const devices = await getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints)

  if (devices.length !== allDevicesIds.length) {
    throw Boom.forbidden(`You don't have permission to transfer these instruments.`)
  }
}

async function getDeviceSiteIds(deviceIds) {
  const [activeDeployments, lastEndedDeployments] = await Promise.all([
    knex('Deployment').whereIn('deviceId', deviceIds).whereNull('end').select('deviceId', 'siteId'),
    knex('Deployment as d')
      .join(
        knex('Deployment')
          .whereIn('deviceId', deviceIds)
          .whereNotNull('end')
          .select('deviceId')
          .max('end as end')
          .groupBy('deviceId')
          .as('lastDeployment'),
        function () {
          this.on('d.deviceId', 'lastDeployment.deviceId').andOn('d.end', 'lastDeployment.end')
        }
      )
      .select('d.deviceId', 'd.siteId'),
  ])

  const deviceSiteIds = new Map()

  for (const deployment of lastEndedDeployments) {
    deviceSiteIds.set(deployment.deviceId, deployment.siteId)
  }

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
