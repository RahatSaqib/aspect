module.exports = require('../utils').seed(seed, 'myanmar_16_device_capacity')

const {
  addDeviceCapacities,
  setCapacityForExistingDevices,
} = require('../utils')

async function seed(knex) {
  await addDeviceCapacities(knex)
  await setCapacityForExistingDevices(knex)
}
