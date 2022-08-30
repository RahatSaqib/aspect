const { knex } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

async function getSourceDevices(sourceDevicesIds) {
  return knex('Device').whereIn('id', sourceDevicesIds).select('id', 'lastPingOn', 'siteId')
}

async function getTargetDevice(targetDeviceId) {
  return knex('Device').where('id', targetDeviceId).first('id', 'siteId')
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

  await trknex('Issue').where('deviceId', sourceDeviceId).update('deviceId', targetDeviceId)
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

async function deleteRepeatedResults(deviceId, trknex) {
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

async function deleteDevice(deviceId, trknex) {
  await trknex('Device').where('id', deviceId).del()
}
module.exports = {
  getSourceDevices,
  getTargetDevice,
  mergeIssuesFromDuplicatedResults,
  mergeDeviceLevelIssues,
  deleteNotifications,
  deleteIssues,
  mergeNonRepeatedResults,
  getDevicesIdsCheckingConstraints,
  deleteResultDownloadLog,
  deleteRepeatedResults,
  deleteDeviceLog,
  deleteDeviceFromDeviceOperation,
  deleteDeviceFromDeviceMaintenance,
  deleteDeviceFromDeviceApprovalLog,
  deleteDeviceFromDeviceApiRaw,
  deleteDeviceFromDeviceApiKey,
  deleteDeviceFromDeviceSim,
  deleteDeviceFromDeviceTag,
  deleteDeviceFromFactTables,
  deleteDevice,
}
