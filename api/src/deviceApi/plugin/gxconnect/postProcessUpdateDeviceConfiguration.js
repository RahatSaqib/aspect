const _ = require('lodash')
const { updateDeviceDetails } = require('../../device')

function* postProcessUpdateDeviceConfiguration(context) {
  const { knex, payload, device: { id: deviceId }, now } = context
  if (!_.isEmpty(_.get(payload, 'data'))) {
    const {
      data: { macAddress, hostId, culture, timezone, instrumentSerialNumbers },
    } = payload
    const deviceDetails = {
      macAddress,
      hostId,
      culture,
      timezone,
    }
    if (instrumentSerialNumbers) {
      deviceDetails.serial = instrumentSerialNumbers.join()
    }
    yield* updateDeviceDetails(
      knex,
      deviceId,
      _.omitBy(deviceDetails, _.isUndefined),
      now
    )
  }
  return {}
}

module.exports = postProcessUpdateDeviceConfiguration
