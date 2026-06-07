/**
 * ASP-7977 Device Name Redesign.
 *
 * Adds DeviceType.acronym — used as the prefix for auto-generated device
 * names (e.g. GeneXpert -> "GX", Molbio Truenat -> "MT").
 * The default device-naming plugin builds names as
 * `${acronym}${Device.id}` (e.g. "GX45", "MT567").
 *
 * Data population (filling the acronym values) is handled by seeds so that it
 * runs through the normal seeding pipeline for every environment:
 *   - dev:  seeds/development/89_populate_device_type_acronym.js
 *   - test: seeds/test/89_populate_device_type_acronym.js
 *   - prod: seeds/zz_shared/89_populate_device_type_acronym.js
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
