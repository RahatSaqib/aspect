const _ = require('lodash')

const cloneSite = async (knex, siteId) => {
  const site = await knex('Site').where('id', siteId).first()
  const newSite = { ...site, id: undefined }
  const [insertedSiteId] = await knex('Site').insert(newSite)
  return insertedSiteId
}

const changeSiteNameToMercyCorps = async (knex, siteId) =>
  knex('Site')
    .where('id', siteId)
    .update({
      name: knex.raw(`CONCAT(name, '-MC')`),
      shortName: knex.raw(`CONCAT(shortName, '-MC')`),
      externalId: knex.raw(`CONCAT(externalId, '-MC')`),
    })

async function seed(knex) {
  const { id: mercyCorpsPartnerId } = await knex('Partner').where({ externalId: 'mercyCorps' }).first('id')

  const mercyCorpsDevices = await knex('Device as d')
    .join('Site as s', 'd.siteId', 's.id')
    .whereNull('d.implementingPartnerId')
    .andWhere(qb => {
      qb.where('d.name', 'like', '%-MC').orWhere('d.name', 'like', '%-(MC)')
    })
    .select({
      deviceId: 'd.id',
      siteId: 's.id',
      siteName: 's.name',
    })

  const mercyCorpsDeviceIds = mercyCorpsDevices.map(mcd => mcd.deviceId)
  await knex('Device').whereIn('id', mercyCorpsDeviceIds).update({ implementingPartnerId: mercyCorpsPartnerId })

  const sitesOfMercyCorpsDevices = _.uniq(
    // Skip sites that already finish in -MC
    mercyCorpsDevices
      .filter(mcd => !mcd.siteName.endsWith('-MC') && !mcd.siteName.endsWith('-(MC)'))
      .map(mcd => mcd.siteId)
  )

  /* eslint-disable no-await-in-loop */
  for (const siteId of sitesOfMercyCorpsDevices) {
    const devices = await knex('Device')
      .where('siteId', siteId)
      .select({ deviceId: 'id', hasImplementingPartner: knex.raw('implementingPartnerId IS NOT NULL') })

    const devicesWithIP = devices.filter(d => d.hasImplementingPartner).map(d => d.deviceId)
    const devicesWithoutIP = devices.filter(d => !d.hasImplementingPartner).map(d => d.deviceId)
    if (devicesWithoutIP.length > 0) {
      // If at least one of the other devices is not Mercy Corps,
      // then duplicate the site with the name "[OLD NAME]-MC" and reassign the MC device to this new "MC" version of the site
      const clonedSiteId = await cloneSite(knex, siteId)
      await changeSiteNameToMercyCorps(knex, clonedSiteId)
      await knex('Device').whereIn('id', devicesWithIP).update({ siteId: clonedSiteId })
      await knex('Result').whereIn('deviceId', devicesWithIP).update({ siteId: clonedSiteId })
    } else {
      // If all the other devices are Mercy Corps, rename the site to "[OLD NAME]-MC"
      await changeSiteNameToMercyCorps(knex, siteId)
    }
  }
}

module.exports = require('../utils').seed(seed, __filename)
