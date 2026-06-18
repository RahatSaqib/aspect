/**
 * ASP-7977 Device Name Redesign.
 *
 * Leaf module (no plugin / no transaction dependencies) that resolves the
 * acronym used to prefix auto-generated device names, and the default name
 * generator used by the base device-naming plugin.
 *
 * Acronym resolution order:
 *   1. DeviceType.acronym column (curated value, populated by seed).
 *   2. Curated override keyed by DeviceType.externalId (stable across renames).
 *   3. Derived from the capital letters of DeviceType.name.
 */

// Curated overrides keyed by the stable DeviceType.externalId. Used to populate
// the acronym column and as a fallback when the column is empty. Device types
// not listed here fall back to deriveAcronym(name).
const ACRONYM_BY_EXTERNAL_ID = {
  CepheidGeneXpert: 'GX',
  molbioTruenat: 'MT',
  BDMGIT: 'MGIT',
  COBAS4800: 'CB',
  HainGenoScan: 'HG',
  SenaiteLims: 'SL',
  m2000: 'M2',
  GenericRDT: 'RDT',
  CustomDevice: 'CD',
}

/**
 * Derives an acronym from a device type name using its capital letters
 * (e.g. "GeneXpert" -> "GX", "Molbio Truenat" -> "MT"). Falls back to the first
 * two alphanumeric characters when the name has fewer than two capitals.
 */
function deriveAcronym(name) {
  const value = String(name || '').trim()
  const capitals = value.replace(/[^A-Z]/g, '')
  if (capitals.length >= 2) {
    return capitals
  }
  const alphanumeric = value.replace(/[^A-Za-z0-9]/g, '')
  return (alphanumeric.slice(0, 2) || 'DV').toUpperCase()
}

/**
 * Resolves the acronym for a DeviceType row ({ externalId, name, acronym }),
 * preferring a stored/curated value before deriving from the name.
 */
function acronymForDeviceType(deviceType = {}) {
  const { externalId, name, acronym } = deviceType
  return acronym || ACRONYM_BY_EXTERNAL_ID[externalId] || deriveAcronym(name)
}

/**
 * Default device-name generator: `${acronym}${deviceId}` (e.g. "GX45").
 * Requires the device row to already exist so the auto-increment id is known.
 *
 * @param {Object} context - { knex, deviceId, deviceTypeId }
 */
async function defaultGenerateDeviceName({ knex, deviceId, deviceTypeId }) {
  const deviceType = await knex('DeviceType').where('id', deviceTypeId).first('externalId', 'name', 'acronym')

  return `${acronymForDeviceType(deviceType || {})}${deviceId}`
}

module.exports = {
  ACRONYM_BY_EXTERNAL_ID,
  deriveAcronym,
  acronymForDeviceType,
  defaultGenerateDeviceName,
}
