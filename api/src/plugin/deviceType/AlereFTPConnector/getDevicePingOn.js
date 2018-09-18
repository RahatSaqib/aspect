const { getLastTestDate } = require('./alereUtils')

async function getDevicePingOn({ knex, device: { id: deviceId } }) {
  return getLastTestDate(knex, deviceId)
}

module.exports = getDevicePingOn
