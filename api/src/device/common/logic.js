const { factGenerateResultCounts, factGenerateDeviceConnectivity } = require('../../fact/actions')

async function recalculateDeviceFactTables(messageContext, deviceIdsToRecalculate) {
  const eventContext = messageContext.bindActionCreators({ factGenerateResultCounts, factGenerateDeviceConnectivity })

  for (const deviceId of deviceIdsToRecalculate) {
    // eslint-disable-next-line no-await-in-loop
    await eventContext.factGenerateResultCounts(deviceId)
    // eslint-disable-next-line no-await-in-loop
    await eventContext.factGenerateDeviceConnectivity(deviceId)
  }
}

const {
  deleteNotifications,
  deleteIssues,
  deleteResultDownloadLog,
  deleteDeviceLog,
  deleteInventoryLog,
  deleteMessages,
  deleteResults,
  deleteDeviceFromDeviceOperation,
  deleteDeviceFromDeviceMaintenance,
  deleteDeviceFromDeviceApprovalLog,
  deleteDeviceFromDeviceApiRaw,
  deleteDeviceFromDeviceTag,
  deleteDeviceFromFactTables,
  deleteDevice: deleteDeviceFromDb,
} = require('./db')

async function deleteDevice(deviceId, trknex) {
  await deleteNotifications(deviceId, trknex)
  await deleteIssues(deviceId, trknex)
  await deleteDeviceLog(deviceId, trknex)
  await deleteResultDownloadLog(deviceId, trknex)
  /**
   * --------------------------------
   * Before deleting in Result table:
   * --------------------------------
   * Delete all InventoryLog's for resultId's which uses old (source) deviceId's.
   * This may happen when we didn't redirect to new (target) deviceId some results
   * which are considered as `repeated` results.
   * ---> Same happens for all tables with `resultId` foreign key (ResultDownloadLog, ...)
   */
  await deleteInventoryLog(deviceId, trknex)
  await deleteMessages(deviceId, trknex)
  await deleteResults(deviceId, trknex)
  await deleteDeviceFromDeviceOperation(deviceId, trknex)
  await deleteDeviceFromDeviceMaintenance(deviceId, trknex)
  await deleteDeviceFromDeviceApprovalLog(deviceId, trknex)
  await deleteDeviceFromDeviceApiRaw(deviceId, trknex)
  await deleteDeviceFromDeviceTag(deviceId, trknex)
  await deleteDeviceFromFactTables(deviceId, trknex)
  await deleteDeviceFromDb(deviceId, trknex)
}

module.exports = { deleteDevice, recalculateDeviceFactTables }
