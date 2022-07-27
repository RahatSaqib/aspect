const Boom = require('@hapi/boom')
const { knex } = require('../../db')
const validate = require('./mergeDevicesValidator')
const { transformGeographyFromUpdates } = require('../../geography/service')
const { getUserFromCredentials } = require('../../auth/constraints')

module.exports = async function (request) {
  const { payload, auth } = request

  const payloadWithGeographyId = await transformGeographyFromUpdates(payload)

  const devicesToMerge = getDevicesToMerge(payload)

  await validate(devicesToMerge)

  const user = await getUserFromCredentials(auth.credentials)

  if (!user) {
    throw Boom.badRequest('Cannot retrieve user from mergeDevices request')
  }

  //TODO: Handle transaction

  // 1. Results not repeated for both devices will be assigned to the definitive one.
  await mergeNotRepeatedResults(devicesToMerge)
  // 2. Results repeated in both should be deleted from the device that will disappear
  await deleteRepeatedResults(devicesToMerge)
  // 3. Results from point 2 should be deleted from notifications, ResultDownloadLog, DeviceLog,
  await deleteRepeatedResultsFromNotifications(devicesToMerge)
  await deleteRepeatedResultsFromResultDownloadLog(devicesToMerge)
  await deleteRepeatedResultsFromDeviceLog(devicesToMerge)
  // 4. Issues and notifications should be merged.
  await mergeIssuesAndNotifications(devicesToMerge)
  // 5. The deleted device should be deleted from deviceoperation, devicemaintenancestatus, deviceaproval, deviceapikey, 
  // deviceapiraw, devicesim, deviceTag, All fact tables with FK to devices.
  await deleteDeviceFromDeviceOperation(devicesToMerge)
  await deleteDeviceFromDeviceMaintenanceStatus(devicesToMerge)
  await deleteDeviceFromDeviceApproval(devicesToMerge)
  await deleteDeviceFromDeviceApiKey(devicesToMerge)
  await deleteDeviceFromDeviceApiRaw(devicesToMerge)
  await deleteDeviceFromDeviceSim(devicesToMerge)
  await deleteDeviceFromDeviceTag(devicesToMerge)
  await deleteDeviceFromFactTables(devicesToMerge)
  // 6. Finally, remove the device.

  return { ok: true, data: { id: insertedId } }
}

function getDevicesToMerge(payload) {
  const { sourceDeviceId, targetDeviceId } = payload
  // TODO: implement (Retrieve devices from DB)
  return [{ id: sourceDeviceId }, { id: targetDeviceId }]
}
