/**
 * ASP-7977 Device Name Redesign.
 *
 * Shared helper: fills DeviceType.acronym for every row that still has a NULL
 * or empty acronym, using the curated map + capital-letters fallback defined in
 * src/device/common/deviceAcronym.js.
 *
 * Called from environment-specific seeds so it runs for dev, test, and prod:
 *   - seeds/development/89_populate_device_type_acronym.js
 *   - seeds/test/89_populate_device_type_acronym.js
 *   - seeds/zz_shared/89_populate_device_type_acronym.js
 *
 * Must run before 90_backfill_device_name_to_notes_and_rename.js.
 */
const Promise = require('bluebird')
const { acronymForDeviceType } = require('../../src/device/common/deviceAcronym')

async function populateDeviceTypeAcronyms(knex) {
  const deviceTypes = await knex('DeviceType')
    .where(builder => builder.whereNull('acronym').orWhere('acronym', ''))
    .select('id', 'externalId', 'name', 'acronym')

  await Promise.each(deviceTypes, deviceType =>
    knex('DeviceType')
      .where('id', deviceType.id)
      .update({ acronym: acronymForDeviceType(deviceType) })
  )
}

module.exports = { populateDeviceTypeAcronyms }
