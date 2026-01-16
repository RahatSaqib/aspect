const { knex } = require('../../db')

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

module.exports = {
  transferDeviceInstruments,
}
