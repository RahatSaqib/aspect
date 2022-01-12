module.exports = require('../utils').seed(seed, __filename)
const { upsertTruenatDeviceTypeAndAssays } = require('../commonTruenat')

async function seed(knex) {
  await upsertTruenatDeviceTypeAndAssays(knex)
  // Initial Test Truenat Device

}
