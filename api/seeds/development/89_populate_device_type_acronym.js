/**
 * ASP-7977 Device Name Redesign.
 *
 * Fills DeviceType.acronym for every row that still has a NULL or empty value.
 * Must run before 96_backfill_device_name_to_notes_and_rename.js.
 */
const { populateDeviceTypeAcronyms } = require('../common/populate_device_type_acronym')

async function seed(knex) {
  await populateDeviceTypeAcronyms(knex)
}

module.exports = require('../utils').seed(seed, __filename)
