/**
 * Creates one Deployment per Device at the device's current site (Device.siteId),
 * with no start and no end (active deployment from the beginning).
 * Idempotent: skips devices that already have at least one deployment.
 *
 * Used by zz_shared, development, and test seeds.
 */
async function seedDeploymentPerDeviceAtSite(knex) {
  const devicesWithSite = await knex('Device')
    .whereNotNull('siteId')
    .select('id as deviceId', 'siteId')

  if (devicesWithSite.length === 0) return

  const deviceIdsWithDeployment = await knex('Deployment').distinct('deviceId').pluck('deviceId')
  const setWithDeployment = new Set(deviceIdsWithDeployment)

  const rows = devicesWithSite
    .filter(d => !setWithDeployment.has(d.deviceId))
    .map(({ deviceId, siteId }) => ({
      deviceId,
      siteId,
      start: null,
      end: null,
    }))

  if (rows.length > 0) {
    await knex('Deployment').insert(rows)
  }
}

module.exports = { seedDeploymentPerDeviceAtSite }
