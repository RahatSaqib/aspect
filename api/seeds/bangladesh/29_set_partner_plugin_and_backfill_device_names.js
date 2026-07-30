/**
 * ASP-7977 Bangladesh device naming.
 *
 * 1. Sets Partner.plugin = 'bangladesh' (was empty on existing DBs because
 *    01_initial.js is one-time and originally seeded plugin as '').
 * 2. Regenerates Device.name / shortName for GeneXpert devices that already
 *    have moduleBayCapacity / gx6cModulesCount / gx10cModulesCount values,
 *    so the "(4m 6c)"-style suffix appears without requiring a manual edit.
 *
 * Idempotent: only updates rows whose stored name differs from the computed
 * Bangladesh name. Safe to re-run if AspectSeed is cleared for this file.
 */
const Promise = require('bluebird')
const generateDeviceName = require('../../src/plugin/partner/Bangladesh/generateDeviceName')
const { GENEXPERT_DEVICE_TYPE_EXTERNAL_ID } = require('../../src/plugin/partner/Bangladesh/geneXpertModuleSuffix')
const {
  partner: { externalId: partnerExternalId },
  plugin,
} = require('./fixtures/partnerData')

module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('Partner').where({ externalId: partnerExternalId }).update({ plugin })

  const devices = await knex('Device as d')
    .join('Partner as p', 'p.id', 'd.partnerId')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .where('p.externalId', partnerExternalId)
    .where('dt.externalId', GENEXPERT_DEVICE_TYPE_EXTERNAL_ID)
    .where(builder => {
      builder
        .where('d.moduleBayCapacity', '>', 0)
        .orWhere('d.gx6cModulesCount', '>', 0)
        .orWhere('d.gx10cModulesCount', '>', 0)
    })
    .orderBy('d.id')
    .select('d.id', 'd.name', 'd.deviceTypeId')

  const now = new Date()

  await Promise.each(devices, async device => {
    const name = await generateDeviceName({
      knex,
      deviceId: device.id,
      deviceTypeId: device.deviceTypeId,
    })

    if (!name || name === device.name) {
      return
    }

    await knex('Device')
      .where('id', device.id)
      .update({
        name,
        shortName: String(name).substr(0, 45),
        updatedOn: now,
      })
  })
}
