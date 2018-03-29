const _ = require('lodash')
const { transact } = require('../../../../db')
const { macAddressValid } = require('../requestValidation')
/*
The purpose of this plugin is to guard against duplicate GxConnect
devices being created. If the macAddress and instrument serial number
match an existing device, return that device
*/
async function preProcessCreateDevice({ auth, payload }) {
  const device = await transact(async knex => {
    const macAddress = _.get(payload, 'configuration.data.macAddress')
    const instrumentSerialNumber = _.get(
      payload,
      'configuration.data.instrumentSerialNumber'
    )
    if (macAddressValid(macAddress)) {
      const { partnerId } = await knex('DeviceApiKey')
        .where({ token: auth.credentials.token })
        .first('partnerId')
      const matchingDevice = await knex
        .from('Device as d')
        .leftJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
        .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where({
          'd.macAddress': macAddress,
          'd.partnerId': partnerId,
        })
        .andWhere(function() {
          if (_.isEmpty(instrumentSerialNumber)) {
            this.whereNull('d.serial')
          } else {
            this.where({ 'd.serial': instrumentSerialNumber })
          }
        })
        .first(
          'd.id',
          'd.partnerId',
          'd.siteId',
          'd.name',
          'd.serial',
          'ds.token as status',
          'dt.externalId as deviceType',
          'dt.plugin as deviceTypePluginName'
        )
      if (!_.isEmpty(matchingDevice)) {
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
