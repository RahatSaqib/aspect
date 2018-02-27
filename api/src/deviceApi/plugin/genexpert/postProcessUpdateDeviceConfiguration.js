const _ = require('lodash')
const { updateDeviceDetails } = require('../../device')

async function postProcessUpdateDeviceConfiguration({
  knex,
  payload,
  device: { id: deviceId },
  now,
}) {
  if (!_.isEmpty(_.get(payload, 'data'))) {
    const {
      data: { macAddress, hostId, culture, timezone, instrumentSerialNumbers },
    } = payload
    const deviceDetails = {
      macAddress,
      hostId,
      culture,
      timezone,
      lastSeenOn: now,
    }
    if (instrumentSerialNumbers) {
      deviceDetails.serial = instrumentSerialNumbers.join()
    }
    await updateDeviceDetails(
      knex,
      deviceId,
      _.omitBy(deviceDetails, _.isEmpty),
      now
    )
  }
  return {}
}

module.exports = postProcessUpdateDeviceConfiguration
