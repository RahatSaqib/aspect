const { knex } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

async function getSourceDevices(sourceDevicesIds) {
  return knex('Device').whereIn('id', sourceDevicesIds).select('id', 'lastPingOn', 'siteId', 'deviceTypeId')
}

async function getTargetDevice(targetDeviceId) {
  return knex('Device').where('id', targetDeviceId).first('id', 'siteId', 'deviceTypeId')
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

async function getDevicesIdsCheckingConstraints(allDevicesIds, dataConstraints) {
  return knex('Device as d')
    .whereIn('d.id', allDevicesIds)
    .join('Site as s', 'd.siteId', 's.id')
    .modify(addConstraints, dataConstraints, { site: 's' })
    .select('d.id')
}

// Delete device
async function deleteNotifications(deviceId, trknex) {
  await trknex('Notification').whereIn('resultId', trknex('Result').where('deviceId', deviceId).select('id')).del()
  await trknex('Notification').whereIn('issueId', trknex('Issue').where('deviceId', deviceId).select('id')).del()
}

async function deleteIssues(deviceId, trknex) {
  await trknex('Issue').where('deviceId', deviceId).del()
}

async function deleteResultDownloadLog(deviceId, trknex) {
  await trknex('ResultDownloadLog').whereIn('resultId', trknex('Result').where('deviceId', deviceId).select('id')).del()
}

async function deleteDeviceLog(deviceId, trknex) {
  await trknex('DeviceLog').whereIn('resultId', trknex('Result').where('deviceId', deviceId).select('id')).del()
}

async function deleteMessages(deviceId, trknex) {
  await trknex('EmailMessage').where('deviceId', deviceId).del()
  await trknex('PushNotificationMessage').where('deviceId', deviceId).del()
  await trknex('SmsMessage').where('deviceId', deviceId).del()
  await trknex('WebhookMessage').where('deviceId', deviceId).del()
}

async function deleteResults(deviceId, trknex) {
  await trknex('Result').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceOperation(deviceId, trknex) {
  await trknex('DeviceOperation').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceMaintenance(deviceId, trknex) {
  await trknex('DeviceMaintenance').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceApprovalLog(deviceId, trknex) {
  await trknex('DeviceApprovalLog').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceApiRaw(deviceId, trknex) {
  await trknex('DeviceApiRaw as dar')
    .whereIn('dar.deviceApiKeyId', trknex('DeviceApiKey as dak').where('dak.deviceId', deviceId).select('id'))
    .del()
}

async function deleteDeviceFromDeviceApiKey(deviceId, trknex) {
  await trknex('DeviceApiKey').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceSim(deviceId, trknex) {
  await trknex('DeviceSim').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceTag(deviceId, trknex) {
  await trknex('DeviceTag').where('deviceId', deviceId).del()
}

async function deleteDeviceFromFactTables(deviceId, trknex) {
  await trknex('FactDeviceExternalSource').where({ deviceId }).del()
  await trknex('FactDeviceFlag').where({ deviceId }).del()
  await trknex('FactResultsDevice').where({ deviceId }).del()
  await trknex('FactResultsDeviceByAssay').where({ deviceId }).del()
  await trknex('FactResultsDeviceByCategory1').where({ deviceId }).del()
  await trknex('FactResultsDeviceByCategory1And2').where({ deviceId }).del()
  await trknex('FactResultsDeviceByTimeFrame').where({ deviceId }).del()
}

async function deleteDeviceSiteHistory(deviceId, trknex) {
  await trknex('DeviceSiteHistory').where('id', deviceId).del()
}

async function deleteDevice(deviceId, trknex) {
  await trknex('Device').where('id', deviceId).del()
}

/**
 * Gets an object containing the i18n keys, the result categories ids, and category labels for the result category 1 and 2
 * @returns An object with the next shape:
 * {
 *   resultCategory1LabelI18nKey,   // The i18nKey of the resultCategory1 label for the assay
 *   resultCategory2LabelI18nKey,   // The i18nKey of the resultCategory2 label for the assay
 *   resultCategory1ResultsId,      // A csv containing the list of possible result category 1 ids for the assay
 *   resultCategory1ResultsI18nKey, // A csv containing the list of possible result category 1 i18n keys for the assay (same order than resultCategory1ResultsId)
 *   resultCategory2ResultsId,      // A csv containing the list of possible result category 2 ids for the assay
 *   resultCategory2ResultsId       // A csv containing the list of possible result category 2 i18n keys for the assay (same order than resultCategory2ResultsId)
 * }
 */
async function getResultCategoriesByAssay(assayId) {
  return knex('ResultCategoryGroup as rcg')
    .innerJoin('Assay as a', 'rcg.assayId', 'a.id')
    .leftJoin('ResultCategory as rc1', 'rcg.resultCategory1Id', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'rcg.resultCategory2Id', 'rc2.id')
    .where('a.id', assayId)
    .select({
      resultCategory1LabelI18nKey: 'a.resultCategory1I18nKey',
      resultCategory2LabelI18nKey: 'a.resultCategory2I18nKey',
      resultCategory1ResultsId: knex.raw('GROUP_CONCAT(DISTINCT rc1.id)'),
      resultCategory1ResultsI18nKey: knex.raw('GROUP_CONCAT(DISTINCT rc1.i18nKey)'),
      resultCategory2ResultsId: knex.raw('GROUP_CONCAT(DISTINCT rc2.id)'),
      resultCategory2ResultsI18nKey: knex.raw('GROUP_CONCAT(DISTINCT rc2.i18nKey)'),
    })
    .first()
}

function getFirstAndLastResults(dataConstraints) {
  return knex('Result as r')
    .modify(addConstraints, dataConstraints, { result: 'r' })
    .groupBy('deviceId')
    .select({
      deviceId: 'id',
      firstEndedOn: knex.raw('MIN(endedOn)'),
      lastEndedOn: knex.raw('MAX(endedOn)'),
    })
    .as('firstAndLastResults')
}

function getDeviceWorkload(extraColumns, dataConstraints) {
  return knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .leftJoin(getFirstAndLastResults(), 'd.id', 'firstAndLastResults.deviceId')
    .leftJoin('DeviceMaintenanceStatusLog as dmsl', 'd.deviceMaintenanceStatusLogId', 'dmsl.id')
    .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
    .modify(q => {
      extraColumns.forEach(ec => q.select({ [ec.fieldId]: knex.raw(ec.selector) }))
    })
    .modify(addConstraints, dataConstraints, { result: 'r', device: 'd' })
    .select(
      'd.name',
      'dms.i18nKey as deviceStatus',
      'd.lastPingOn',
      'firstAndLastResults.firstEndedOn as firstResultEndedOn',
      'firstAndLastResults.lastEndedOn as lastResultEndedOn'
    )
    .groupBy('r.deviceId')
}

module.exports = {
  getDeviceWorkload,
  getResultCategoriesByAssay,
  getSourceDevices,
  getTargetDevice,
  mergeIssuesFromDuplicatedResults,
  mergeDeviceLevelIssues,
  deleteNotifications,
  deleteIssues,
  mergeNonRepeatedResults,
  mergeMessages,
  getDevicesIdsCheckingConstraints,
  deleteResultDownloadLog,
  deleteMessages,
  deleteResults,
  deleteDeviceLog,
  deleteDeviceFromDeviceOperation,
  deleteDeviceFromDeviceMaintenance,
  deleteDeviceFromDeviceApprovalLog,
  deleteDeviceFromDeviceApiRaw,
  deleteDeviceFromDeviceApiKey,
  deleteDeviceFromDeviceSim,
  deleteDeviceFromDeviceTag,
  deleteDeviceFromFactTables,
  deleteDeviceSiteHistory,
  deleteDevice,
}
