const _ = require('lodash')
const Boom = require('boom')
const { transact } = require('../../../../db')
const { findDevices } = require('../device')

/*
The purpose of this plugin is to guard against duplicate GxConnect
devices being created. If the macAddress and instrument serial number
match an existing device, return that device
*/
async function preProcessCreateDevice({ auth, payload }) {
  const device = await transact(async knex => {
    const macAddress = _.get(payload, 'configuration.data.macAddress', null)
    const deviceNameFromGxAlert = _.get(payload, 'name', null)
    const hostId = _.get(payload, 'configuration.data.hostId', null)
    const countryAbbreviation = _.get(
      payload,
      'configuration.data.country',
      null
    )
    const deviceSerialNumber = _.get(
      payload,
      'configuration.data.deviceSerialNumber'
    )
    if (countryAbbreviation) {
      const { partnerId } = await knex('DeviceApiKey')
        .where({ token: auth.credentials.token })
        .first('partnerId')
      const deviceDetails = {
        partnerId,
        hostId,
        deviceSerialNumber,
        countryAbbreviation,
        macAddress,
        deviceName: deviceNameFromGxAlert,
      }
      let matchingDevices = await findDevices(deviceDetails, knex)
      if (!_.isEmpty(matchingDevices)) {
        let matchingDevice = null
        if (matchingDevices.length > 1) {
          matchingDevices = _.filter(matchingDevices, { macAddress })
          if (matchingDevices.length > 1) {
            throw Boom.conflict(
              `Cannot uniquely determine which device this request came from using ${JSON.stringify(
                deviceDetails
              )})`
            )
          } else if (matchingDevices.length === 1) {
            ;[matchingDevice] = matchingDevices
          }
        } else if (matchingDevices.length === 1) {
          ;[matchingDevice] = matchingDevices
        }
        await knex
          .from('DeviceApiKey')
          .where({ deviceId: matchingDevice.id })
          .update({ deviceId: null, revoked: 1 })

        await knex
          .from('DeviceApiKey')
          .where({
            token: auth.credentials.token,
          })
          .update({ deviceId: matchingDevice.id })
        return matchingDevice
      }
    }
    return null
  })
  return device
}

module.exports = preProcessCreateDevice
