module.exports = require('../utils').seed(seed, __filename)
const { transformPayload } = require('../../src/plugin/deviceType/transformPayload')
const customFieldsPakistan = require('../../src/forms/formsDefinition/CustomFields_Pakistan.json')
const { getOffsetFromTimeZone } = require('../../src/shared/date')

async function seed(knex) {
  return
  const { minDeviceLogId, maxDeviceLogId } = await knex('DeviceLog')
    .whereNotNull('resultId') // Only result payloads
    .first({
      minDeviceLogId: knex.raw('MIN(id)'),
      maxDeviceLogId: knex.raw('MAX(id)'),
    })

  const batchSize = 50
  const startFrom = minDeviceLogId
  const endAt = maxDeviceLogId

  let processed = startFrom - 1
  while (processed < endAt) {
    const start = processed + 1
    const end = Math.min(processed + batchSize, endAt)
    // eslint-disable-next-line no-console
    console.log(`processing batch: ${start}-${end}`)

    // eslint-disable-next-line no-await-in-loop
    const deviceLogsToUpdate = await getDeviceLogsToUpdateInRange(knex, start, end)

    if (deviceLogsToUpdate.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await knex('DeviceLog').insert(deviceLogsToUpdate).onConflict('id').merge()
    }

    processed = end
  }
}

const getDeviceLogsToUpdateInRange = async (knex, minDeviceLogId, maxDeviceLogId) => {
  const range = [minDeviceLogId, maxDeviceLogId]

  const deviceLogsToUpdate = await knex('DeviceLog as dl')
    .join('Device as d', 'dl.deviceId', 'd.id')
    .join('TimeZone as tz', 'd.timezone', 'tz.id')
    .whereNotNull('resultId') // Only result payloads
    .whereBetween('dl.id', range)
    .select({ id: 'dl.id', rawMessage: 'dl.rawMessage', timezone: 'd.timezone', timezoneIANA: 'tz.timeZone' })

  return Promise.all(
    deviceLogsToUpdate.map(async data => {
      const pakistanTimeZoneData = {
        timezone: data.timezone,
        timezoneIANA: data.timezoneIANA,
        timezoneUtcOffset: getOffsetFromTimeZone(data.timezoneIANA),
      }

      const transformedPayload = transformPayload(
        JSON.parse(data.rawMessage),
        true,
        pakistanTimeZoneData,
        customFieldsPakistan
      )

      const deviceLogToUpdate = {
        id: data.id,
        rawMessage2: JSON.stringify(transformedPayload),
      }
      return deviceLogToUpdate
    })
  )
}
