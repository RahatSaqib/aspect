const Boom = require('@hapi/boom')
const { getSite } = require('../query')

module.exports = async devicesToMerge => {
  const [sourceDevice] = devicesToMerge
  await validateDeviceIsNotActive(sourceDevice)
  await validateSameSite(devicesToMerge)
}

async function validateDeviceIsNotActive({ id }) {
  // TODO: implement
  // const existingSite = await getRepeatedSiteIfExists(name, shortName)
  // if (existingSite) {
  //   throw Boom.badData(`A site with the same name (${name}) or short name (${shortName}) already exists.`)
  // }
}

async function validateSameSite({ sourceDevice: { siteId: sourceSiteId }, targetDevice: { siteId: targetSiteId } }) {
  if (sourceSiteId !== targetSiteId) {
    throw Boom.badData('Cannot merge devices from different sites')
  }
}

