/**
 * ASP-7977 Device Name Redesign.
 *
 * Adds DeviceType.acronym, used as the prefix for auto-generated device names
 * (e.g. GeneXpert -> "GX", Molbio Truenat -> "MT"). The default device-naming
 * plugin builds names as `${acronym}${Device.id}` (e.g. "GX45", "MT567").
 *
 * The column is populated by the zz_shared seed
 * `89_populate_device_type_acronym.js`; this migration only adds the schema.
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('DeviceType', table => {
    table.string('acronym', 16).nullable()
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('DeviceType', table => {
    table.dropColumn('acronym')
  })
}
