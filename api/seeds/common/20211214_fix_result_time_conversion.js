const Promise = require('bluebird')

module.exports = async knex => {
  // we have to fix the double-conversion of result start and end dates using the device time zone; using the country as fallback
  const { timezone: countryTimezone } = await knex('Country').first('timezone')

  // get timezones for all devices:
  const devices = await knex('Device as d')
    .join('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .join('TimeZone as tz', 'd.timezone', 'tz.id')
    .where('dt.externalId', 'CepheidGeneXpert')
    .select('d.id', 'tz.timeZone')

  await Promise.each(devices, async device => {
    await knex('Result')
      .update({
        startedOn: knex.raw(`CONVERT_TZ(startedOn, 'UTC', ?)`, device.timeZone || countryTimezone),
        endedOn: knex.raw(`CONVERT_TZ(endedOn, 'UTC', ?)`, device.timeZone || countryTimezone),
      })
      .where({ deviceId: device.id })
  })
}
