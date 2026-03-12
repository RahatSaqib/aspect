const Boom = require('@hapi/boom')
const { deviceApprovalToId } = require('../../shared/dictionary')

// Approval status constants
const APPROVED = 'approved'
const PENDING_DEPLOYMENT = 'pendingDeployment'
const DECOMMISSIONED = 'decommissioned'

function getNewApprovalStatus({ hasDeployments }) {
  return hasDeployments ? APPROVED : PENDING_DEPLOYMENT
}

async function getDeviceApprovalState(trx, deviceId) {
  const device = await trx('Device as d')
    .join('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
    .where('d.id', deviceId)
    .first('d.id', 'd.deviceApprovalId', 'da.token as approvalToken')

  if (!device) {
    throw Boom.notFound('Device not found')
  }

  return device
}

async function getDeploymentCount(trx, deviceId) {
  const { count = 0 } = (await trx('Deployment').where({ deviceId }).count('id as count').first()) || {}
  return Number(count)
}

async function saveDeviceApprovalIfChanged(trx, { deviceId, approvalToken, userId = null, now = new Date() }) {
  const currentDevice = await getDeviceApprovalState(trx, deviceId)
  const deviceApprovalId = await deviceApprovalToId(approvalToken)

  if (currentDevice.deviceApprovalId === deviceApprovalId) {
    return {
      ...currentDevice,
      changed: false,
      deviceApprovalId,
      approvalToken,
    }
  }

  await trx('Device').where('id', deviceId).update({
    deviceApprovalId,
    updatedOn: now,
    updatedBy: userId,
  })

  await trx('DeviceApprovalLog').insert({
    deviceId,
    deviceApprovalId,
    changedOn: now,
    createdOn: now,
    createdBy: userId,
  })

  return {
    ...currentDevice,
    changed: true,
    deviceApprovalId,
    approvalToken,
  }
}

async function syncDeviceApprovalFromDeployments(trx, { deviceId, userId = null, now = new Date() }) {
  const currentDevice = await getDeviceApprovalState(trx, deviceId)

  if (currentDevice.approvalToken === DECOMMISSIONED) {
    return {
      ...currentDevice,
      changed: false,
    }
  }

  const deploymentCount = await getDeploymentCount(trx, deviceId)
  const approvalToken = getNewApprovalStatus({ hasDeployments: deploymentCount > 0 })

  return saveDeviceApprovalIfChanged(trx, { deviceId, approvalToken, userId, now })
}

async function decommissionDevice(trx, { deviceId, userId = null, now = new Date() }) {
  return saveDeviceApprovalIfChanged(trx, {
    deviceId,
    approvalToken: DECOMMISSIONED,
    userId,
    now,
  })
}

async function reactivateDevice(trx, { deviceId, userId = null, now = new Date() }) {
  const deploymentCount = await getDeploymentCount(trx, deviceId)
  const approvalToken = getNewApprovalStatus({ hasDeployments: deploymentCount > 0 })

  return saveDeviceApprovalIfChanged(trx, { deviceId, approvalToken, userId, now })
}

async function assertDeploymentsEditable(trx, deviceId) {
  const device = await getDeviceApprovalState(trx, deviceId)

  if (device.approvalToken === DECOMMISSIONED) {
    throw Boom.conflict('Deployments cannot be edited for a decommissioned device')
  }

  return device
}

module.exports = {
  assertDeploymentsEditable,
  decommissionDevice,
  reactivateDevice,
  syncDeviceApprovalFromDeployments,
  APPROVED,
  PENDING_DEPLOYMENT,
  DECOMMISSIONED,
}
