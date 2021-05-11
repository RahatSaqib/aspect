const { seedTable } = require('../utils')

module.exports = async knex => {
  const overridedSeeds = { seedsFolder: null, staticDataFiles: [] }
  await seedTable(knex, 'DeviceMaintenanceStatus', overridedSeeds)
}
