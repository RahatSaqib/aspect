const _ = require('lodash')
const { updateDeviceDetails } = require('../../device')

async function postProcessUpdateDeviceConfiguration({
  knex,
  payload,
  device: { id: deviceId },
  now,
}) {
  let device = {}
  if (!_.isEmpty(_.get(payload, 'data'))) {
    const {
      data: { macAddress, hostId, culture, timezone, instrumentSerialNumber },
    } = payload
    const deviceDetails = {
      macAddress,
      hostId,
      culture,
      timezone,
      lastSeenOn: now,
    }
    if (instrumentSerialNumber) {
      deviceDetails.serial = instrumentSerialNumber
    }
    device = await updateDeviceDetails(
      knex,
      deviceId,
      _.omitBy(deviceDetails, _.isEmpty),
      now
    )
  }
  return { device }
}

module.exports = postProcessUpdateDeviceConfiguration
