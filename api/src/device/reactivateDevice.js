const Boom = require('@hapi/boom')
const { transact } = require('../db')
const { getUserFromCredentials, getConstraints } = require('../auth/constraints')
const { getDevicesIdsCheckingConstraints } = require('./common/db')
const { showDevice } = require('./service')
const { checkSiteAccess } = require('../site/common/db')
const {
  assertDeviceCanBeReactivated,
  APPROVED,
  saveDeviceApprovalIfChanged,
} = require('./common/deviceApprovalService')
const { getDeploymentsHistory, updateDeployment } = require('./deployment/deploymentService')

const ALLOWED_JOB_FUNCTIONS = new Set(['Super Admin', 'Regional Admin'])

async function reactivateDevice(request) {
  const {
    params: { deviceId },
    payload: { siteId },
    auth: { credentials },
  } = request

  const user = await getUserFromCredentials(credentials)
  assertAllowedJobFunction(credentials)
  await validateDeviceAccess(deviceId, credentials)
  await validateSiteAccess(siteId, credentials)

  const timezoneIANA = user?.timezoneIANA ?? user?.personTimezoneIANA ?? 'Etc/UTC'
  const now = new Date()

  await transact(async trx => {
    await assertDeviceCanBeReactivated(trx, deviceId)

    const deployments = await getDeploymentsHistory(trx, deviceId)
    const activeDeployment = deployments.find(d => d.end === null)

    if (!activeDeployment) {
      throw Boom.conflict('Device has no active deployment')
    }

    if (Number(activeDeployment.siteId) !== Number(siteId)) {
      await updateDeployment(trx, { deviceId, siteId, userId: user.id, now, timezoneIANA })
    }

    await saveDeviceApprovalIfChanged(trx, { deviceId, approvalToken: APPROVED, userId: user.id, now })
  })

  return showDevice(request)
}

function assertAllowedJobFunction({ jobFunctionNames = [] }) {
  const allowed = jobFunctionNames.some(name => ALLOWED_JOB_FUNCTIONS.has(name))

  if (!allowed) {
    throw Boom.forbidden()
  }
}

async function validateDeviceAccess(deviceId, credentials) {
  const dataConstraints = await getConstraints(credentials)
  const devices = await getDevicesIdsCheckingConstraints([deviceId], dataConstraints)

  if (devices.length !== 1) {
    throw Boom.forbidden("You don't have permission to update the requested device")
  }
}

async function validateSiteAccess(siteId, credentials) {
  const dataConstraints = await getConstraints(credentials)
  const site = await checkSiteAccess(siteId, dataConstraints)

  if (!site) {
    throw Boom.forbidden("You don't have permission to use the requested site")
  }
}

module.exports = { reactivateDevice }
