const Boom = require('@hapi/boom')
const { deviceApprovalToId } = require('../../shared/dictionary')

module.exports = async devicesToMerge => {
  await validateDeviceIsNotActive(devicesToMerge.sourceDevice)
  // await validateSameSite(devicesToMerge)
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
