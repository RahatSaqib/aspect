const Boom = require('@hapi/boom')
const { sr } = require('date-fns/locale')
const { knex } = require('../db')
const { getUserFromCredentials } = require('../auth/constraints')
const { deviceApprovalToId } = require('../shared/dictionary')

module.exports = async function ({ payload, auth }) {
  return mergeDevices({ payload, auth })
}

async function mergeDevices({ payload, auth }) {
  // const payloadWithGeographyId = await transformGeographyFromUpdates(params)
  const devicesToMerge = await getDevicesToMerge(payload)

  await validate(devicesToMerge)

  // const user = await getUserFromCredentials(auth.credentials)

  // TODO: Handle transaction
  await deleteDeviceFromDeviceApiKey(devicesToMerge.sourceDevice.id)
  // 4. Issues and notifications should be merged.
  await mergeIssuesFromDuplicatedResults(devicesToMerge)
  await updateDeviceOnRemainingIssues(devicesToMerge)

  // 1. Results not repeated for both devices will be assigned to the definitive one.
  await mergeNonRepeatedResults(devicesToMerge)

  await deleteRemainingIssues(devicesToMerge.sourceDevice.id)
  // 3. Results from point 2 should be deleted from notifications, ResultDownloadLog, DeviceLog,
  await deleteRemainingNotifications(devicesToMerge.sourceDevice.id)

  await deleteRemainingDeviceLog(devicesToMerge.sourceDevice.id)
  await deleteRemainingResultDownloadLog(devicesToMerge.sourceDevice.id)
  // 2. Results repeated in both should be deleted from the device that will disappear
  await deleteRepeatedResults(devicesToMerge.sourceDevice.id)
  // 5. The deleted device should be deleted from deviceoperation, devicemaintenance, deviceaproval, deviceapikey,
  // deviceapiraw, devicesim, deviceTag, All fact tables with FK to devices.
  await deleteDeviceFromDeviceOperation(devicesToMerge.sourceDevice.id)
  await deleteDeviceFromDeviceMaintenance(devicesToMerge.sourceDevice.id)
  await deleteDeviceFromDeviceApprovalLog(devicesToMerge.sourceDevice.id)
  await deleteDeviceFromDeviceApiRaw(devicesToMerge.sourceDevice.id)
  await deleteDeviceFromDeviceSim(devicesToMerge.sourceDevice.id)
  await deleteDeviceFromDeviceTag(devicesToMerge.sourceDevice.id)
  await deleteDeviceFromFactTables(devicesToMerge.sourceDevice.id)

  // // 6. Finally, remove the device.
  await deleteDevice(devicesToMerge.sourceDevice.id)

  return { ok: true, data: {} }
}

async function getDevicesToMerge({ sourceDeviceId, targetDeviceId }) {
  const sourceDevice = await knex('Device').where('id', sourceDeviceId).first('id', 'deviceApprovalId', 'siteId')
  const targetDevice = await knex('Device').where('id', targetDeviceId).first('id', 'siteId')
  return { sourceDevice, targetDevice }
}

function getRepeatedResultsQuery(sourceResultTableAlias, targetDeviceId) {
  return knex(
    knex('Result')
      .where('deviceID', targetDeviceId)
      .where('externalId', knex.raw(`${sourceResultTableAlias}.externalId`))
      .select('externalId')
      .as('t')
  ).select('t.externalId')
}

async function mergeIssuesFromDuplicatedResults(devicesToMerge) {
  await knex('Issue as i')
    .update('i.deviceId', devicesToMerge.targetDevice.id)
    .update('i.resultId', knex.raw('pivot.targetResultId'))
    .join(
      knex('Result as sr')
        .join('Result as tr', 'sr.externalId', 'tr.externalId')
        .where('sr.deviceId', devicesToMerge.sourceDevice.id)
        .where('tr.deviceId', devicesToMerge.targetDevice.id)
        .select({ sourceResultId: 'sr.id', targetResultId: 'tr.id', externalId: 'sr.externalId' })
        .as('pivot'),
      'i.resultId',
      'pivot.sourceResultId'
    )
    .where('i.id', '>', 0)
}

async function updateDeviceOnRemainingIssues(devicesToMerge) {
  await knex('Issue')
    .where('deviceId', devicesToMerge.sourceDevice.id)
    .update('deviceId', devicesToMerge.targetDevice.id)
}

async function deleteRemainingNotifications(deviceId) {
  await knex('Notification').whereIn('resultId', knex('Result').where('deviceId', deviceId).select('id')).del()
}

async function deleteRemainingIssues(deviceId) {
  await knex('Issue').where('deviceId', deviceId).del()
}

async function mergeNonRepeatedResults(devicesToMerge) {
  await knex('Result as sourceResults')
    .where({ deviceId: devicesToMerge.sourceDevice.id })
    .whereNotIn('sourceResults.externalId', getRepeatedResultsQuery('sourceResults', devicesToMerge.targetDevice.id))
    .update('deviceId', devicesToMerge.targetDevice.id)

  await knex('DeviceLog')
    .where({ deviceId: devicesToMerge.sourceDevice.id })
    .update({ deviceId: devicesToMerge.targetDevice.id })
}

async function deleteRemainingResultDownloadLog(deviceId) {
  await knex('ResultDownloadLog').whereIn('resultId', knex('Result').where('deviceId', deviceId).select('id')).del()
}

async function deleteRemainingDeviceLog(deviceId) {
  await knex('DeviceLog').whereIn('resultId', knex('Result').where('deviceId', deviceId).select('id')).del()
}

async function deleteRepeatedResults(deviceId) {
  await knex('Result').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceOperation(deviceId) {
  await knex('DeviceOperation').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceMaintenance(deviceId) {
  await knex('DeviceMaintenance').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceApprovalLog(deviceId) {
  await knex('DeviceApprovalLog').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceApiRaw(deviceId) {
  await knex('DeviceApiRaw as dar')
    .whereIn('dar.deviceApiKeyId', knex('DeviceApiKey as dak').where('dak.deviceId', deviceId).select('id'))
    .del()
}

async function deleteDeviceFromDeviceApiKey(deviceId) {
  await knex('DeviceApiKey').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceSim(deviceId) {
  await knex('DeviceSim').where('deviceId', deviceId).del()
}

async function deleteDeviceFromDeviceTag(deviceId) {
  await knex('DeviceTag').where('deviceId', deviceId).del()
}

async function deleteDeviceFromFactTables(deviceId) {
  await knex('FactDeviceExternalSource').where({ deviceId }).del()
  await knex('FactDeviceFlag').where({ deviceId }).del()
  await knex('FactResultsDevice').where({ deviceId }).del()
  await knex('FactResultsDeviceByAssay').where({ deviceId }).del()
  await knex('FactResultsDeviceByCategory1').where({ deviceId }).del()
  await knex('FactResultsDeviceByCategory1And2').where({ deviceId }).del()
  await knex('FactResultsDeviceByTimeFrame').where({ deviceId }).del()
}

async function deleteDevice(deviceId) {
  await knex('Device').where('id', deviceId).del()
}

const validate = async devicesToMerge => {
  await validateDeviceIsNotActive(devicesToMerge.sourceDevice)
  await validateSameSite(devicesToMerge)
}

async function validateDeviceIsNotActive(sourceDevice) {
  const deviceApprovedId = await deviceApprovalToId('approved')

  if (sourceDevice.deviceApprovalId === deviceApprovedId) {
    throw Boom.badData(`An active device cannot be merged. Change the approval status first.`)
  }
}

async function validateSameSite({ sourceDevice: { siteId: sourceSiteId }, targetDevice: { siteId: targetSiteId } }) {
  if (sourceSiteId !== targetSiteId) {
    throw Boom.badData('Cannot merge devices from different sites')
  }
}
