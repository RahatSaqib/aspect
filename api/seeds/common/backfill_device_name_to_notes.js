/**
 * ASP-7977 Device Name Redesign.
 *
 * One-time backfill that, for every existing device:
 *   1. Preserves the current Device.name in Device.notes in a recoverable
 *      format: `Original name: <old name>` (kept above any pre-existing notes).
 *   2. Renames Device.name (and shortName) to the new scheme
 *      `${DeviceType.acronym}${Device.id}` (e.g. "GX45", "MT567").
 *
 * The original name can later be recovered from notes (see
 * seeds/scripts/recover_device_original_names.sql) if a user has not set a
 * custom name.
 *
 * Idempotent: only devices whose notes do not already contain "Original name:"
 * are selected, so re-running is a no-op. Updates run sequentially to stay
 * gentle on the database.
 */
const Promise = require('bluebird')

const ORIGINAL_NAME_PREFIX = 'Original name: '
const NOTES_MAX_LENGTH = 2000

async function backfillDeviceNameToNotes(knex) {
  const now = new Date()

  const devices = await knex('Device as d')
    .join('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .where(builder => builder.whereNull('d.notes').orWhere('d.notes', 'not like', `%${ORIGINAL_NAME_PREFIX}%`))
    .orderBy('d.id')
    .select('d.id', 'd.name', 'd.notes', 'dt.acronym')

  await Promise.each(devices, device => {
    const acronym = device.acronym || 'DV'
    const newName = `${acronym}${device.id}`
    const originalNameNote = `${ORIGINAL_NAME_PREFIX}${device.name ?? ''}`
    const notes = device.notes ? `${originalNameNote}\n${device.notes}` : originalNameNote

    return knex('Device')
      .where('id', device.id)
      .update({
        notes: notes.substr(0, NOTES_MAX_LENGTH),
        name: newName,
        shortName: newName.substr(0, 45),
        updatedOn: now,
      })
  })
}

module.exports = { backfillDeviceNameToNotes, ORIGINAL_NAME_PREFIX }
