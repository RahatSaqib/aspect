const _ = require('lodash')
const Boom = require('@hapi/boom')
const {
  getOrCreateSite,
  findDevices,
  preProcessAddDeviceData: genexpertPreProcessAddDeviceData,
} = require('../gxUtils')
const { createNewDevice } = require('../../../deviceApi/device')
const { getDateOrDefault } = require('../../../shared/date')

function getDeviceIdentifiersFromPayload(payload) {
  const macAddress = _.get(payload, 'configuration.data.macAddress', null)
  const hostId = _.get(payload, 'configuration.data.hostId', null)
  const deviceSerialNumber = _.get(payload, 'configuration.data.deviceSerialNumber', null)
  const deviceName = _.get(payload, 'name', null)
  const deviceIdFromGxAlertSource = _.get(payload, 'configuration.data.gxAlertDeviceId', null)
  return {
    macAddress,
    hostId,
    deviceSerialNumber,
    deviceName,
    deviceIdFromGxAlertSource,
  }
}

async function preProcessAddDeviceData(context) {
  const { device, payload, knex, now } = context
  // Get or create source device
  // GxAlert forwards data from source devices.
  // We want the context's device to be replaced with the source device
  const geneXpertDevice = await getOrCreateDevice(knex, payload, device, now)
  if (!_.isEmpty(geneXpertDevice)) {
    geneXpertDevice.deviceTypePluginName = device.deviceTypePluginName
    context.device = geneXpertDevice
  } else {
    const { macAddress, hostId, deviceSerialNumber, deviceName, deviceIdFromGxAlertSource } =
      getDeviceIdentifiersFromPayload(payload)
    throw Boom.badData(
      `Cannot find or create device with the provided data - MAC Address: ${macAddress} | Host ID: ${hostId} | Serial Number: ${deviceSerialNumber} | Device Name: ${deviceName} | GxAlert Device ID: ${deviceIdFromGxAlertSource}`
    )
  }
  await genexpertPreProcessAddDeviceData(context)
}

async function getOrCreateDevice(knex, payload, gxAlertDevice, now) {
  const { id: gxAlertDeviceId, partnerId } = gxAlertDevice
  const { macAddress, hostId, deviceSerialNumber, deviceIdFromGxAlertSource } = getDeviceIdentifiersFromPayload(payload)
  if (!deviceIdFromGxAlertSource) {
    throw Boom.badRequest('Must specify GxAlert device ID for data from GxAlert')
  }

  const deviceTypeExternalId = _.get(payload, 'type.id', null)
  if (!deviceTypeExternalId) {
    throw Boom.badRequest('Must specify device type for data from GxAlert')
  }
  let countryCode = _.get(payload, 'configuration.data.country', null)
  if (!countryCode) {
    ;[countryCode] = await knex('Device as d')
      .leftJoin('Site as s', 'd.siteId', 's.id')
      .innerJoin('Geography as g', function () {
        this.on('d.geographyId', 'g.id').orOn('s.geographyId', 'g.id')
      })
      .innerJoin('Country as c', 'g.countryId', 'c.id')
      .where('d.id', gxAlertDeviceId)
      .pluck('c.abbreviation')
  }
  const deviceName = _.get(payload, 'name', null)
  let deviceShortName = _.get(payload, 'configuration.data.shortName', deviceName)
  if (deviceShortName && deviceShortName.length > 45) {
    deviceShortName = deviceShortName.substr(0, 45)
  }
  const deviceDetails = {
    partnerId,
    hostId,
    deviceSerialNumber,
    macAddress,
    countryCode,
    deviceIdFromGxAlertSource,
  }
  let matchingDevices = await findDevices(deviceDetails, knex)
  if (_.isEmpty(matchingDevices)) {
    const site = await getOrCreateSite(
      knex,
      gxAlertDevice,
      payload,
      now,
      countryCode,
      deviceName,
      deviceShortName,
      true
    )
    const lastPingOn = getDateOrDefault(payload, 'configuration.data.lastPingOn', now)
    const putInService = getDateOrDefault(payload, 'configuration.data.putInService', now)
    const { device, error } = await createNewDevice(knex, now, {
      deviceTypeExternalId,
      name: deviceName,
      shortName: deviceShortName,
      serial: payload.serial,
      partnerId,
      siteId: site.id,
      geographyId: site.geographyId,
      approval: 'assigned',
      macAddress,
      hostId: _.get(payload, 'configuration.data.hostId', null),
      culture: _.get(payload, 'configuration.data.culture', null),
      timezone: _.get(payload, 'configuration.data.timezone', null),
      configurationData: JSON.stringify(_.get(payload, 'configuration.data', '{}')),
      putInService,
      lastSeenOn: lastPingOn,
      lastPingOn,
    })
    if (error) {
      throw error
    }
    deviceDetails.deviceId = device.id
    matchingDevices = await findDevices(deviceDetails, knex)
  }
  let matchingDevice = null
  if (matchingDevices.length > 1) {
    const matchingDevicesByMac = _.filter(matchingDevices, { macAddress })
    if (matchingDevicesByMac.length === 1) {
      ;[matchingDevice] = matchingDevicesByMac
    } else {
      const matchingDevicesByName = _.filter(matchingDevices, {
        name: deviceName,
      })
      if (matchingDevicesByName.length === 1) {
        ;[matchingDevice] = matchingDevicesByName
      }
    }
  } else if (matchingDevices.length === 1) {
    ;[matchingDevice] = matchingDevices
  }
  return matchingDevice
}

module.exports = preProcessAddDeviceData
