/**
 * ASP-7977 Device Name Redesign.
 *
 * Backs up each device's current name into Device.notes ("Original name: ...")
 * and renames the device to the new `${DeviceType.acronym}${Device.id}` scheme.
 *
 * Runs after 89_populate_device_type_acronym.js so acronyms are available.
 */
const { backfillDeviceNameToNotes } = require('../common/backfill_device_name_to_notes')

async function seed(knex) {
  return backfillDeviceNameToNotes(knex)
}

module.exports = require('../utils').seed(seed, __filename)
