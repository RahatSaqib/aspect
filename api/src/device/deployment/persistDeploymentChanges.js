const { transact } = require('../../db')
const { getUserFromCredentials } = require('../../auth/constraints')
const { recalculateDeviceFactTables } = require('../common/logic')
const { assertDeviceIsNotDecommissioned } = require('../common/deviceApprovalService')
const { assignGeneratedDeviceName } = require('../common/deviceNaming')
const { resultSiteAssigned } = require('../../result/actions')
const { applyDeploymentChanges, finalizeDeploymentTimeline, normalizeDeploymentDates } = require('./deploymentService')

async function persistDeploymentChanges(request) {
  const {
    params,
    auth,
    payload,
    plugins: { messageContext },
  } = request
  const { deviceId } = params
  const { changes } = payload
  const user = await getUserFromCredentials(auth.credentials)
  const timezoneIANA = user?.timezoneIANA ?? user?.personTimezoneIANA ?? 'Etc/UTC'
  const now = new Date()
  const hasAddedActiveDeployment = changes.some(change => {
    if (change.action !== 'add') {
      return false
    }

    return normalizeDeploymentDates(change).end === null
  })

  let resultIdsToRelink = []

  // Absent from the payload means "unchanged"; an empty string clears the stored value.
  const hasCustomNamePart = payload.customNamePart !== undefined

  await transact(async trx => {
    // Decommissioned devices are read-only for deployments (add/update/delete).
    // Active (approved) devices may be edited; removing all deployments syncs them
    // back to pendingDeployment via finalizeDeploymentTimeline.
    await assertDeviceIsNotDecommissioned(trx, deviceId)
    await applyDeploymentChanges(trx, { deviceId, changes, userId: user.id, now })
    ;({ resultIdsToRelink } = await finalizeDeploymentTimeline(trx, {
      deviceId,
      userId: user.id,
      now,
      timezoneIANA,
      hasAddedActiveDeployment,
    }))

    if (hasCustomNamePart) {
      const customNamePart = String(payload.customNamePart || '').trim()
      const { deviceTypeId, partnerPluginName, deviceTypePluginName } =
        (await trx('Device as d')
          .join('Partner as p', 'd.partnerId', 'p.id')
          .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
          .where('d.id', deviceId)
          .first('d.deviceTypeId', 'p.plugin as partnerPluginName', 'dt.plugin as deviceTypePluginName')) || {}

      await trx('Device').where('id', deviceId).update({ customNamePart, updatedOn: now, updatedBy: user.id })
      await assignGeneratedDeviceName(trx, {
        deviceId: parseInt(deviceId, 10),
        deviceTypeId,
        partnerPluginName,
        deviceTypePluginName,
      })
    }
  })

  await recalculateDeviceFactTables(messageContext, [parseInt(deviceId, 10)])

  if (resultIdsToRelink.length > 0) {
    const ctx = messageContext.bindActionCreators({ resultSiteAssigned })
    for (const rid of resultIdsToRelink) {
      ctx.resultSiteAssigned(rid)
    }
  }

  return { ok: true }
}

module.exports = { persistDeploymentChanges }
