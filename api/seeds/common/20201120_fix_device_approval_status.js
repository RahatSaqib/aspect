module.exports = require('../utils').seed(seed, __filename)

const Promise = require('bluebird')
const deviceApproval = require('../fixtures/DeviceApproval.json')

async function seed(knex) {
  await Promise.each(deviceApproval.data, deviceStatus => {
    return knex('DeviceApproval')
      .where({
        token: deviceStatus.token,
      })
      .update({ ...deviceStatus })
  })
}
module.exports = seed
