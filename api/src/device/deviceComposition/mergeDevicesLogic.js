const { knex } = require('../../db')

const { deleteDevice } = require('../common/logic')

async function executeMergeDevices(trknex, sourceDeviceId, targetDeviceId, userId) {
  await mergeIssuesFromDuplicatedResults(trknex, sourceDeviceId, targetDeviceId)
  await mergeDeviceLevelIssues(trknex, sourceDeviceId, targetDeviceId)
  await mergeNonRepeatedResults(trknex, sourceDeviceId, targetDeviceId)
  await mergeMessages(trknex, sourceDeviceId, targetDeviceId)
  await mergeInstruments(trknex, sourceDeviceId, targetDeviceId, userId)

  await deleteDeployments(trknex, sourceDeviceId)

  await deleteDevice(sourceDeviceId, trknex)
}

async function deleteDeployments(trknex, sourceDeviceId) {
  await trknex('Deployment').where('deviceId', sourceDeviceId).delete()
}

// Merge instruments from source to target device
async function mergeInstruments(trknex, sourceDeviceId, targetDeviceId, userId) {
  const now = new Date()
  const sourceInstruments = await trknex('Instrument')
    .where('deviceId', sourceDeviceId)
    .select('id', 'serial', 'active')

  if (sourceInstruments.length === 0) {
    return
  }

  const sourceInstrumentIds = sourceInstruments.map(instrument => instrument.id)
  const sourceSerials = sourceInstruments.map(instrument => instrument.serial)
  const duplicateTargetInstruments = sourceSerials.length
    ? await trknex('Instrument')
        .where('deviceId', targetDeviceId)
        .whereIn('serial', sourceSerials)
        .select('id', 'serial')
    : []

  const duplicateSerials = new Set(duplicateTargetInstruments.map(instrument => instrument.serial))
  const duplicateSourceInstrumentIds = sourceInstruments
    .filter(instrument => duplicateSerials.has(instrument.serial))
    .map(instrument => instrument.id)
  const sourceActiveDuplicateSerials = [
    ...new Set(
      sourceInstruments
        .filter(instrument => instrument.active && duplicateSerials.has(instrument.serial))
        .map(instrument => instrument.serial)
    ),
  ]

  if (sourceActiveDuplicateSerials.length > 0) {
    await trknex('Instrument')
      .where('deviceId', targetDeviceId)
      .whereIn('serial', sourceActiveDuplicateSerials)
      .update({ active: true, updatedOn: now, updatedBy: userId })
  }

  const sourceInstrumentIdsToMove = sourceInstrumentIds.filter(id => !duplicateSourceInstrumentIds.includes(id))

  if (sourceInstrumentIdsToMove.length > 0) {
    await trknex('Instrument')
      .whereIn('id', sourceInstrumentIdsToMove)
      .update({ deviceId: targetDeviceId, updatedOn: now, updatedBy: userId })
  }

  if (duplicateSourceInstrumentIds.length > 0) {
    await mergeAndDeleteInstrumentModules(
      trknex,
      duplicateSourceInstrumentIds,
      sourceInstruments,
      duplicateTargetInstruments
    )
    await trknex('Instrument').whereIn('id', duplicateSourceInstrumentIds).delete()
  }
}

// Before deleting duplicate source instruments, merge their InstrumentModule_READ rows into the
// surviving target instruments (same serial, different id) using the same GREATEST/IF logic
// as the incremental subscriber, then delete the source rows to satisfy the FK constraint.
async function mergeAndDeleteInstrumentModules(
  trknex,
  duplicateSourceInstrumentIds,
  sourceInstruments,
  duplicateTargetInstruments
) {
  const serialToTargetId = new Map(duplicateTargetInstruments.map(i => [i.serial, i.id]))
  const sourceIdToTargetId = new Map(
    duplicateSourceInstrumentIds.map(sourceId => {
      const serial = sourceInstruments.find(i => i.id === sourceId)?.serial
      return [sourceId, serialToTargetId.get(serial)]
    })
  )

  const allSourceModules = await trknex('InstrumentModule_READ')
    .whereIn('instrumentId', duplicateSourceInstrumentIds)
    .select('instrumentId', 'moduleName', 'moduleSerial', 'lastResultDate')

  const rowsToUpsert = allSourceModules
    .map(m => ({ ...m, instrumentId: sourceIdToTargetId.get(m.instrumentId) }))
    .filter(m => m.instrumentId != null)

  if (rowsToUpsert.length > 0) {
    await trknex('InstrumentModule_READ')
      .insert(rowsToUpsert)
      .onConflict(['instrumentId', 'moduleName'])
      .merge({
        moduleSerial: trknex.raw(
          'IF(VALUES(lastResultDate) >= InstrumentModule_READ.lastResultDate, VALUES(moduleSerial), InstrumentModule_READ.moduleSerial)'
        ),
        lastResultDate: trknex.raw('GREATEST(InstrumentModule_READ.lastResultDate, VALUES(lastResultDate))'),
      })
  }

  await trknex('InstrumentModule_READ').whereIn('instrumentId', duplicateSourceInstrumentIds).delete()
}

async function mergeIssuesFromDuplicatedResults(trknex, sourceDeviceId, targetDeviceId) {
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

async function mergeDeviceLevelIssues(trknex, sourceDeviceId, targetDeviceId) {
  await trknex('Issue').where('deviceId', sourceDeviceId).whereNull('resultId').update('deviceId', targetDeviceId)
}

async function mergeNonRepeatedResults(trknex, sourceDeviceId, targetDeviceId) {
  const repeatedResultsQuery = trknex(
    trknex('Result')
      .where('deviceId', targetDeviceId)
      .where('externalId', knex.raw(`sourceResults.externalId`))
      .select('externalId')
      .as('t')
  ).select('t.externalId')

  await trknex('Result as sourceResults')
    .where({ deviceId: sourceDeviceId })
    .whereNotIn('sourceResults.externalId', repeatedResultsQuery)
    .update('deviceId', targetDeviceId)
}

async function mergeMessages(trknex, sourceDeviceId, targetDeviceId) {
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

module.exports = {
  executeMergeDevices,
}
