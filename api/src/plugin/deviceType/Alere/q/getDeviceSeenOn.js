const { getLastTestDate } = require('../alereUtils')

async function getDeviceSeenOn({ knex, device: { id: deviceId } }) {
  return getLastTestDate(knex, deviceId)
}

module.exports = getDeviceSeenOn
