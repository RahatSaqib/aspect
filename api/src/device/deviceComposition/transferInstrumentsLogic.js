const { executeMergeDevices: mergeDevice } = require('./mergeDevicesLogic')
const { knex } = require('../../db')

// Handles merging and transferring instruments/devices in a transaction
async function transferDeviceInstruments(trknex, { sourceDeviceIds, sourceInstruments, targetDeviceId }, userId) {
  const sourceDeviceInstrumentCounts = await getDeviceInstrumentCounts(trknex, sourceDeviceIds)
  const instrumentsByDevice = groupInstrumentIdsByDevice(sourceInstruments)
  const devicesToFullyMerge = selectDevicesToFullyMerge(instrumentsByDevice, sourceDeviceInstrumentCounts)
  const devicesToPartiallyTransfer = sourceDeviceIds.filter(deviceId => !devicesToFullyMerge.has(deviceId))
  const sourceDevices = await getSourceDevices(trknex, sourceDeviceIds)
  const sourceDeviceMap = new Map(sourceDevices.map(sourceDevice => [sourceDevice.id, sourceDevice]))

  await Promise.all(
    [...devicesToFullyMerge].map(deviceId =>
      mergeDevice(trknex, sourceDeviceMap.get(deviceId).id, targetDeviceId, userId)
    )
  )

  await Promise.all(
    devicesToPartiallyTransfer.map(async deviceId => {
      const sourceInstrumentIds = instrumentsByDevice.get(deviceId)
      await mergeIssuesFromDuplicatedResultsForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
      await mergeNonRepeatedResultsForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
      await mergeDeviceLogsForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
      await mergeMessagesForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
      await transferInstrumentIds(trknex, sourceInstrumentIds, targetDeviceId, userId)
    })
  )

  return { deletedDeviceIds: [...devicesToFullyMerge] }
}

async function transferInstrumentIds(trknex, sourceInstrumentIds, targetDeviceId, userId) {
  await trknex('Instrument')
    .whereIn('id', sourceInstrumentIds)
    .update({ deviceId: targetDeviceId, updatedOn: new Date(), updatedBy: userId })
}

async function mergeIssuesFromDuplicatedResultsForInstruments(trknex, sourceInstrumentIds, targetDeviceId) {
  await trknex('Issue as i')
    .update('i.deviceId', targetDeviceId)
    .update('i.resultId', trknex.raw('pivot.targetResultId'))
    .join(
      knex('Result as sr')
        .join('Instrument as si', qb => {
          qb.on('si.serial', 'sr.instrumentSerial').andOn('si.deviceId', 'sr.deviceId')
        })
        .join('Result as tr', 'sr.externalId', 'tr.externalId')
        .whereIn('si.id', sourceInstrumentIds)
        .where('tr.deviceId', targetDeviceId)
        .select({ sourceResultId: 'sr.id', targetResultId: 'tr.id', externalId: 'sr.externalId' })
        .as('pivot'),
      'i.resultId',
      'pivot.sourceResultId'
    )
    .where('i.id', '>', 0)
}

async function mergeNonRepeatedResultsForInstruments(trknex, sourceInstrumentIds, targetDeviceId) {
  const repeatedResultsQuery = trknex(
    trknex('Result')
      .where('deviceID', targetDeviceId)
      .where('externalId', knex.raw(`sourceResults.externalId`))
      .select('externalId')
      .as('t')
  ).select('t.externalId')

  await trknex('Result as sourceResults')
    .join('Instrument as i', qb => {
      qb.on('i.serial', 'sourceResults.instrumentSerial').andOn('i.deviceId', 'sourceResults.deviceId')
    })
    .whereIn('i.id', sourceInstrumentIds)
    .whereNotIn('sourceResults.externalId', repeatedResultsQuery)
    .update('sourceResults.deviceId', targetDeviceId)
}

async function mergeDeviceLogsForInstruments(trknex, sourceInstrumentIds, targetDeviceId) {
  await trknex('DeviceLog')
    .whereIn(
      'resultId',
      trknex('Result as r')
        .join('Instrument as i', qb => {
          qb.on('i.serial', 'r.instrumentSerial').andOn('i.deviceId', 'r.deviceId')
        })
        .where('r.deviceId', targetDeviceId)
        .whereIn('i.id', sourceInstrumentIds)
        .select('r.id')
    )
    .update({ deviceId: targetDeviceId })
}

async function mergeMessagesForInstruments(trknex, sourceInstrumentIds, targetDeviceId) {
  const messagesToMergeFilter = qb =>
    qb.whereIn(
      'm.resultId',
      knex('Result as r')
        .join('Instrument as i', qb => {
          qb.on('i.serial', 'r.instrumentSerial').andOn('i.deviceId', 'r.deviceId')
        })
        .where('r.deviceId', targetDeviceId)
        .whereIn('i.id', sourceInstrumentIds)
        .select('r.id')
    )

  await trknex('AlertMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('EmailMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('PushNotificationMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('SmsMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
  await trknex('WebhookMessage as m').modify(messagesToMergeFilter).update('deviceId', targetDeviceId)
}

// Returns a Map of deviceId to instrument count
async function getDeviceInstrumentCounts(trknex, sourceDeviceIds) {
  const rows = await trknex('Instrument as i')
    .whereIn('i.deviceId', sourceDeviceIds)
    .groupBy('i.deviceId')
    .select('i.deviceId')
    .count({ instrumentCount: '*' })

  return new Map(rows.map(row => [row.deviceId, Number(row.instrumentCount)]))
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

async function getSourceDevices(trknex, sourceDeviceIds) {
  return trknex('Device').whereIn('id', sourceDeviceIds).select('id', 'deviceApiKeyId')
}

module.exports = {
  transferDeviceInstruments,
}
