const { transact } = require('../../db')
const { getUserFromCredentials } = require('../../auth/constraints')
const { recalculateDeviceFactTables } = require('../common/logic')
const { assertDeviceIsNotDecommissioned } = require('../common/deviceApprovalService')
const { resultSiteAssigned } = require('../../result/actions')
const {
  applyDeploymentChanges,
  finalizeDeploymentTimeline,
  normalizeDeploymentDates,
} = require('./deploymentService')

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

  await transact(async trx => {
    await assertDeviceIsNotDecommissioned(trx, deviceId)
    await applyDeploymentChanges(trx, { deviceId, changes, userId: user.id, now })
    ;({ resultIdsToRelink } = await finalizeDeploymentTimeline(trx, {
      deviceId,
      userId: user.id,
      now,
      timezoneIANA,
      hasAddedActiveDeployment,
    }))
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
