const Promise = require('bluebird')

module.exports = require('../utils').seed(async knex => {
  const deviceIds = await knex('Device').pluck('id')
  await Promise.each(deviceIds, async deviceId => {
    const { instrumentSerial: lastInstrumentSerial } =
      (await knex('Result').where({ deviceId }).whereNotNull('instrumentSerial').orderBy('endedOn', 'desc').first()) ||
      {}
    if (lastInstrumentSerial) await knex('Device').where({ id: deviceId }).update({ lastInstrumentSerial })
  })
}, __filename)
