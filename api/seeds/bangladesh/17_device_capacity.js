module.exports = require('../utils').seed(seed, __filename)

const { addDeviceCapacities, setCapacityForExistingDevices } = require('../utils')
const deviceCapacities = require('./fixtures/deviceCapacity.json')

async function seed(knex) {
  await addDeviceCapacities(knex, deviceCapacities)
  await setCapacityForExistingDevices(knex)
}
