const {
  deleteNotifications,
  deleteIssues,
  deleteResultDownloadLog,
  deleteDeviceLog,
  deleteRepeatedResults,
  deleteDeviceFromDeviceOperation,
  deleteDeviceFromDeviceMaintenance,
  deleteDeviceFromDeviceApprovalLog,
  deleteDeviceFromDeviceApiRaw,
  deleteDeviceFromDeviceApiKey,
  deleteDeviceFromDeviceSim,
  deleteDeviceFromDeviceTag,
  deleteDeviceFromFactTables,
  deleteDevice: deleteDeviceFromDb,
} = require('./db')

async function deleteDevice(deviceId, trknex) {
  await deleteDeviceFromDeviceApiKey(deviceId, trknex)
  await deleteIssues(deviceId, trknex)
  await deleteNotifications(deviceId, trknex)
  await deleteDeviceLog(deviceId, trknex)
  await deleteResultDownloadLog(deviceId, trknex)
  await deleteRepeatedResults(deviceId, trknex)
  await deleteDeviceFromDeviceOperation(deviceId, trknex)
  await deleteDeviceFromDeviceMaintenance(deviceId, trknex)
  await deleteDeviceFromDeviceApprovalLog(deviceId, trknex)
  await deleteDeviceFromDeviceApiRaw(deviceId, trknex)
  await deleteDeviceFromDeviceSim(deviceId, trknex)
  await deleteDeviceFromDeviceTag(deviceId, trknex)
  await deleteDeviceFromFactTables(deviceId, trknex)
  await deleteDeviceFromDb(deviceId, trknex)
}

module.exports = { deleteDevice }
