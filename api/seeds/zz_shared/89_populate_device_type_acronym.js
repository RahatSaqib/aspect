/**
 * ASP-7977 Device Name Redesign.
 *
 * Populates DeviceType.acronym for every device type that does not already have
 * one, using the curated map (keyed by externalId) with a capital-letters
 * fallback derived from the name (e.g. GeneXpert -> "GX", Molbio Truenat -> "MT").
 *
 * Must run before 90_backfill_device_name_to_notes_and_rename.js, which uses the
 * acronym to build the new device names.
 */
const Promise = require('bluebird')
const { acronymForDeviceType } = require('../../src/device/common/deviceAcronym')

async function seed(knex) {
  const deviceTypes = await knex('DeviceType')
    .where(builder => builder.whereNull('acronym').orWhere('acronym', ''))
    .select('id', 'externalId', 'name', 'acronym')

  await Promise.each(deviceTypes, deviceType =>
    knex('DeviceType')
      .where('id', deviceType.id)
      .update({ acronym: acronymForDeviceType(deviceType) })
  )
}

module.exports = require('../utils').seed(seed, __filename)
