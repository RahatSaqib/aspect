/**
 * Creates one Deployment per Device at the device's current site (Device.siteId),
 * with no start and no end (active deployment from the beginning).
 * Runs for test seeds.
 */
const { seedDeploymentPerDeviceAtSite } = require('../run_deployment_per_device_at_site')

async function seed(knex) {
  return seedDeploymentPerDeviceAtSite(knex)
}

module.exports = require('../utils').seed(seed, __filename)
