module.exports = require('../utils').seed(seed, 'test_12_device_capacity')

const {
  addDeviceCapacities,
  setCapacityForExistingDevices,
} = require('../utils')

async function seed(knex) {
  await addDeviceCapacities(knex)
  await setCapacityForExistingDevices(knex)
}
