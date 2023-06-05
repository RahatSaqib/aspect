const { seed, seedTable } = require('../utils')

module.exports = seed(async knex => {
  const overridedSeeds = { seedsFolder: null, staticDataFiles: [] }
  seedTable(knex, 'ConsumableReason', overridedSeeds)
}, __filename)
