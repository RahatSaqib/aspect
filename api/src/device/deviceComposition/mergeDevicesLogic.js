const { knex } = require('../../db')

const { deleteDevice } = require('../common/logic')

async function executeMergeDevices(trknex, sourceDevice, targetDevice, userId) {
  await mergeIssuesFromDuplicatedResults(trknex, sourceDevice, targetDevice)
  await mergeDeviceLevelIssues(trknex, sourceDevice, targetDevice)
  await mergeNonRepeatedResults(trknex, sourceDevice, targetDevice)
  await mergeMessages(trknex, sourceDevice, targetDevice)
  await mergeInstruments(trknex, sourceDevice, targetDevice, userId)
  // TODO: Remove this when DeviceApiKey.deviceId column is removed
  await trknex('DeviceApiKey').where('deviceId', sourceDevice.id).update({ deviceId: null })

  await deleteDeployments(trknex, sourceDevice.id)

  await deleteDevice(sourceDevice.id, trknex)
}

async function deleteDeployments(trknex, sourceDeviceId) {
  await trknex('Deployment').where('deviceId', sourceDeviceId).delete()
}

// Merge instruments from source to target device
async function mergeInstruments(trknex, sourceDevice, targetDevice, userId) {
  // Move all instruments from the source device to the target device
  await trknex('Instrument')
    .where('deviceId', sourceDevice.id)
    .update({ deviceId: targetDevice.id, updatedOn: new Date(), updatedBy: userId })
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

module.exports = {
  executeMergeDevices,
}
