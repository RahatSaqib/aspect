module.exports = require('../utils').seed(seed)

const {
  addDeviceCapacities,
  setCapacityForExistingDevices,
} = require('../utils')

async function seed(knex) {
  await addDeviceCapacities(knex)
  await setCapacityForExistingDevices(knex)
}
