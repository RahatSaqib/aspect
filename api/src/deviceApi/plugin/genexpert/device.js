const _ = require('lodash')

async function findDevices(availableDeviceDetails, knex) {
  const {
    deviceId,
    partnerId,
    hostId,
    deviceSerialNumber,
    countryCode,
    deviceIdFromGxAlertSource,
  } = availableDeviceDetails
  const fields = [
    'd.id',
    'd.partnerId',
    'd.siteId',
    'd.name',
    'd.serial',
    'd.macAddress',
    'd.configurationData',
    'd.lastSeenOn',
    'ds.token as status',
    'dt.externalId as deviceType',
    'dt.plugin as deviceTypePluginName',
    'dtc.name as deviceTypeCategory',
  ]
  const deviceQuery = knex
    .from('Device as d')
    .leftJoin('Site as s', 's.id', 'd.siteId')
    .innerJoin('Geography as g', function() {
      this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
    })
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .leftJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
  if (deviceId) {
    return deviceQuery
      .clone()
      .where('d.id', deviceId)
      .select(fields)
  }
  let matchingDevices = []
  if (partnerId) {
    if (deviceIdFromGxAlertSource) {
      matchingDevices = await deviceQuery
        .clone()
        .whereRaw(
          `JSON_EXTRACT(d.configurationData, "$.gxAlertDeviceId") = ${deviceIdFromGxAlertSource}`
        )
        .andWhere('d.partnerId', partnerId)
        .select(fields)
    }
    if (_.isEmpty(matchingDevices) && countryCode) {
      if (hostId && deviceSerialNumber) {
        matchingDevices = await deviceQuery
          .clone()
          .where('d.partnerId', partnerId)
          .andWhere('d.hostId', hostId)
          .andWhere('d.serial', deviceSerialNumber)
          .andWhere('c.abbreviation', countryCode)
          .select(fields)
      }
    }
  }
  return matchingDevices
}

module.exports = { findDevices }
