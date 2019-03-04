module.exports = require('../utils').seed(seed)

const { seedDeviceMaintenanceType } = require('../utils')

async function seed(knex) {
  await seedDeviceMaintenanceType(knex)
}
