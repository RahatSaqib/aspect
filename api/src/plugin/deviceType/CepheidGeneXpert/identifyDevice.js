const _ = require('lodash')
const Boom = require('@hapi/boom')
const { transact } = require('../../../db')
const { findDevices } = require('../gxUtils')

/**
 * Identifies an existing device using MAC address and device serial number.
 * This prevents duplicate GxConnect devices from being created.
 * If the macAddress and instrument serial number match an existing device, returns that device.
 *
 * @param {Object} request - The request object with auth and payload
 * @returns {Promise<Object|null>} Device object if found, null otherwise
 */
async function identifyDevice(request) {
  const device = await transact(async trx => {
    const { auth, payload } = request
    const hostId = _.get(payload, 'configuration.data.hostId', null)
    const countryCode = _.get(payload, 'configuration.data.country', null)
    const deviceSerialNumber = _.get(payload, 'configuration.data.deviceSerialNumber')
    const macAddress = _.get(payload, 'configuration.data.macAddress')

    if (countryCode) {
      const { partnerId } = await trx('DeviceApiKey').where({ token: auth.credentials.token }).first('partnerId')
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
      let matchingDevices = await findDevices(deviceDetails, trx)
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
        await trx.from('DeviceApiKey').where({ deviceId: matchingDevice.id }).update({ revoked: 1, updatedOn: now })
        await trx
          .from('DeviceApiKey')
          .where({
            token: auth.credentials.token,
          })
          .update({ deviceId: matchingDevice.id, updatedOn: now })

        // Fetch full device data with all joins
        const fullDevice = await trx('Device as d')
          .innerJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
          .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
          .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
          .leftJoin('Site as s', 'd.siteId', 's.id')
          .leftJoin('Geography as g', 's.geographyId', 'g.id')
          .leftJoin('Country as c', 'g.countryId', 'c.id')
          .leftJoin('Partner as p', 'p.id', 'd.partnerId')
          .where('d.id', matchingDevice.id)
          .first(
            'd.id',
            'd.partnerId',
            'd.siteId',
            's.geographyId',
            'd.name',
            'd.shortName',
            'd.serial',
            'd.macAddress',
            'd.configurationData',
            'd.connectSettingsSentOn',
            'd.lastSeenOn',
            'd.putInService',
            'da.token as approval',
            'dt.externalId as deviceType',
            'dt.plugin as deviceTypePluginName',
            'p.plugin as partnerPluginName',
            'dtc.name as deviceTypeCategory',
            'c.abbreviation as countryAbbreviation'
          )

        return fullDevice
      }
    }
    return null
  })
  return device
}

module.exports = { identifyDevice }
