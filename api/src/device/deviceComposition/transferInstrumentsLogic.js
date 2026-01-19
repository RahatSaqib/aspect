const { knex } = require('../../db')

async function transferDeviceInstruments(trknex, sourceInstrumentIds, targetDeviceId, userId) {
  await mergeIssuesFromDuplicatedResultsForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
  await mergeNonRepeatedResultsForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
  await mergeDeviceLogsForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
  await mergeMessagesForInstruments(trknex, sourceInstrumentIds, targetDeviceId)
  await transferInstrumentIds(trknex, sourceInstrumentIds, targetDeviceId, userId)
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

module.exports = {
  transferDeviceInstruments,
}
