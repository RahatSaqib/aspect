const _ = require('lodash')
const Boom = require('boom')
const { transact } = require('../../../db')
/*
The purpose of this plugin is to guard against duplicate GxConnect
devices being created. If the macAddress and instrument serial number
match an existing device, return that device
*/
function* preProcessCreateDevice(request, now) {
  return yield transact(function*(knex) {
    const { auth, payload } = request
    const macAddress = _.get(payload, 'configuration.data.macAddress')
    const instrumentSerialNumbers = _.get(
      payload,
      'configuration.data.instrumentSerialNumbers'
    )
    if (macAddress) {
      const matchingDevice = yield knex
        .from('Device as d')
        .leftJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
        .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .where({ 'd.macAddress': macAddress })
        .andWhere(function() {
          if (_.isEmpty(instrumentSerialNumbers)) {
            this.whereNull('d.serial')
          } else {
            this.where({ 'd.serial': instrumentSerialNumbers.join() })
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
        yield knex
          .from('DeviceApiKey')
          .where({ deviceId: matchingDevice.id })
          .update({ deviceId: null, revoked: 1 })

        yield knex
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
}

module.exports = preProcessCreateDevice
