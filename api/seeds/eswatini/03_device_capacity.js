module.exports = require('../utils').seed(seed, __filename)

const { addDeviceCapacities } = require('../utils')

async function seed(knex) {
  await addDeviceCapacities(knex)
}
