const _ = require('lodash')
const Boom = require('@hapi/boom')
const { transact } = require('../../../db')
const { findDevices } = require('../gxUtils')

/*
The purpose of this plugin is to guard against duplicate GxConnect
devices being created. If the macAddress and instrument serial number
match an existing device, return that device
*/
async function preProcessCreateDevice({ auth, payload }) {
  const device = await transact(async knex => {
    const hostId = _.get(payload, 'configuration.data.hostId', null)
    const countryCode = _.get(payload, 'configuration.data.country', null)
    const deviceSerialNumber = _.get(payload, 'configuration.data.deviceSerialNumber')
    const macAddress = _.get(payload, 'configuration.data.macAddress')
    if (countryCode) {
      const { partnerId } = await knex('DeviceApiKey').where({ token: auth.credentials.token }).first('partnerId')
      const deviceDetails = {
        partnerId,
        hostId,
        deviceSerialNumber,
        macAddress,
        countryCode,
      }
      /**
       * get ALL devices which match parameters
       */
      let matchingDevices = await findDevices(deviceDetails, knex)
      /**
       * filter out decommissioned devices.
       * --> Notice that same device may be moved out to another location, and for changing location - it
       * should be first decommissioned, then re-installed in new location. In this case we create a new entry in
       * Device table. And in this case func findDevices returns old decommissioned devices (matching deviceSerialNumber or
       * macAddress, etc). And in below line we clean returned list from all decommissioned devices.
       */
      matchingDevices = matchingDevices.filter(
        it => it.deviceMaintenanceStatusExternalId !== 'inactiveDecommissioned' && it.approval !== 'decommissioned'
      )

      if (!_.isEmpty(matchingDevices)) {
        let matchingDevice = null
        if (matchingDevices.length > 1) {
          throw Boom.conflict(
            `Cannot uniquely determine which device this request came from using ${JSON.stringify(deviceDetails)})`
          )
        } else if (matchingDevices.length === 1) {
          ;[matchingDevice] = matchingDevices
        }

        const now = new Date()
        await knex.from('DeviceApiKey').where({ deviceId: matchingDevice.id }).update({ revoked: 1, updatedOn: now })
        await knex
          .from('DeviceApiKey')
          .where({
            token: auth.credentials.token,
          })
          .update({ deviceId: matchingDevice.id, updatedOn: now })
        return matchingDevice
      }
    }
    return null
  })
  return device
}

module.exports = preProcessCreateDevice
