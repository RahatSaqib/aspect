const { executeMergeDevices: mergeDevice } = require('./mergeDevicesLogic')
const { knex } = require('../../db')

// Handles merging and transferring instruments/devices in a transaction
async function transferDeviceInstruments(trknex, { groupedInstruments, targetDeviceId }, userId) {
  const sourceDeviceIds = groupedInstruments.map(d => d.deviceId)
  const sourceDeviceInstrumentCounts = await getDeviceInstrumentCounts(trknex, sourceDeviceIds)
  const instrumentsByDevice = new Map(groupedInstruments.map(d => [d.deviceId, d.instrumentIds]))
  const devicesToFullyMerge = selectDevicesToFullyMerge(instrumentsByDevice, sourceDeviceInstrumentCounts)
  const devicesToPartiallyTransfer = sourceDeviceIds.filter(deviceId => !devicesToFullyMerge.has(deviceId))
  const sourceDevicesData = await getSourceDevices(trknex, sourceDeviceIds)
  const sourceDeviceMap = new Map(sourceDevicesData.map(sourceDevice => [sourceDevice.id, sourceDevice]))

  const targetDeviceMeta = await getDeviceMeta(trknex, targetDeviceId)
  const targetDeployments = await getDeviceDeployments(trknex, targetDeviceId)

  await Promise.all(
    [...devicesToFullyMerge].map(async deviceId => {
      const instrumentSerials = await getInstrumentSerialsByDeviceId(trknex, deviceId)
      await mergeDevice(trknex, sourceDeviceMap.get(deviceId).id, targetDeviceId, userId)
      await updateTransferredResultsSiteIds(trknex, {
        targetDeviceId,
        partnerId: targetDeviceMeta.partnerId,
        timezoneIANA: targetDeviceMeta.timezone,
        deployments: targetDeployments,
        instrumentSerials,
      })
    })
  )

  await Promise.all(
    devicesToPartiallyTransfer.map(async deviceId => {
      const sourceInstrumentIds = instrumentsByDevice.get(deviceId)
      const instrumentSerials = await getInstrumentSerialsByInstrumentIds(trknex, sourceInstrumentIds)
      await mergeIssuesFromDuplicatedResultsForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
      await mergeNonRepeatedResultsForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
      await mergeMessagesForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
      await transferInstrumentIds(trknex, sourceInstrumentIds, targetDeviceId, userId)
      await updateTransferredResultsSiteIds(trknex, {
        targetDeviceId,
        partnerId: targetDeviceMeta.partnerId,
        timezoneIANA: targetDeviceMeta.timezone,
        deployments: targetDeployments,
        instrumentSerials,
      })
    })
  )

  const deviceIdsToSync = [...new Set([...devicesToPartiallyTransfer, targetDeviceId])]
  await syncInstrumentsConnectedFromInstruments(trknex, deviceIdsToSync)

  return { deletedDeviceIds: [...devicesToFullyMerge] }
}

async function getDeviceMeta(trknex, deviceId) {
  return trknex('Device as d').where('d.id', deviceId).first({ partnerId: 'd.partnerId', timezone: 'd.timezone' })
}

async function getDeviceDeployments(trknex, deviceId) {
  return trknex('Deployment as dep')
    .where('dep.deviceId', deviceId)
    .orderByRaw('dep.start IS NULL DESC, dep.start ASC')
    .select('dep.siteId', 'dep.start', 'dep.end')
}

async function getInstrumentSerialsByInstrumentIds(trknex, instrumentIds) {
  if (!instrumentIds || instrumentIds.length === 0) {
    return []
  }
  const rows = await trknex('Instrument').whereIn('id', instrumentIds).select('serial')
  return rows.map(r => r.serial).filter(Boolean)
}

async function getInstrumentSerialsByDeviceId(trknex, deviceId) {
  const rows = await trknex('Instrument').where('deviceId', deviceId).select('serial')
  return rows.map(r => r.serial).filter(Boolean)
}

async function updateTransferredResultsSiteIds(
  trknex,
  { targetDeviceId, partnerId, timezoneIANA, deployments, instrumentSerials }
) {
  if (!instrumentSerials || instrumentSerials.length === 0) {
    return
  }

  // If device has no deployments, align transferred results with "undeployed" state.
  if (!deployments || deployments.length === 0) {
    await trknex('Result as r')
      .where('r.deviceId', targetDeviceId)
      .where('r.partnerId', partnerId)
      .whereIn('r.instrumentSerial', instrumentSerials)
      .update({ siteId: null })
    return
  }

  const updatePromises = deployments.map(dep =>
    trknex('Result as r')
      .where('r.deviceId', targetDeviceId)
      .where('r.partnerId', partnerId)
      .whereIn('r.instrumentSerial', instrumentSerials)
      .modify(qb => {
        if (dep.start !== null) {
          qb.whereRaw('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) >= ?', [timezoneIANA, dep.start])
        }
        if (dep.end !== null) {
          qb.whereRaw('DATE(CONVERT_TZ(r.endedOn, "+00:00", ?)) <= ?', [timezoneIANA, dep.end])
        }
      })
      .update({
        siteId: dep.siteId,
        reportableSiteId: trknex.raw('IF(r.reportableSiteId = r.siteId, ?, r.reportableSiteId)', [dep.siteId]),
        referringSiteId: trknex.raw(
          'IF(r.referringSiteId IS NOT NULL AND r.referringSiteId = r.siteId, ?, r.referringSiteId)',
          [dep.siteId]
        ),
      })
  )

  await Promise.all(updatePromises)
}

async function syncInstrumentsConnectedFromInstruments(trknex, deviceIds) {
  await Promise.all(
    deviceIds.map(async deviceId => {
      const row = await trknex('Instrument').where('deviceId', deviceId).count({ cnt: '*' }).first()
      const cnt = row ? Number(row.cnt) : 0
      await trknex('Device').where('id', deviceId).update({ instrumentsConnected: cnt })
    })
  )
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
      .where('deviceId', targetDeviceId)
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
