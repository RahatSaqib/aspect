const _ = require('lodash')
const Boom = require('boom')
const { getOrCreateSite } = require('../site')
const genexpertPreProcessAddDeviceData = require('../preProcessAddDeviceData')
const { findDevices } = require('../device')

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
    throw Boom.badData(`Cannot find or create device with the provided data`)
  }
  await genexpertPreProcessAddDeviceData(context)
}

async function getOrCreateDevice(knex, payload, gxAlertDevice, now) {
  const { id: gxAlertDeviceId, partnerId } = gxAlertDevice
  const deviceIdFromGxAlertSource = _.get(
    payload,
    'configuration.data.gxAlertDeviceId',
    null
  )
  if (!deviceIdFromGxAlertSource) {
    throw Boom.badRequest(
      'Must specify GxAlert device ID for data from GxAlert'
    )
  }

  const deviceTypeExternalId = _.get(payload, 'type.id', null)
  if (!deviceTypeExternalId) {
    throw Boom.badRequest('Must specify device type for data from GxAlert')
  }
  const macAddress = _.get(payload, 'configuration.data.macAddress', null)
  const hostId = _.get(payload, 'configuration.data.hostId', null)
  const deviceSerialNumber = _.get(
    payload,
    'configuration.data.deviceSerialNumber',
    null
  )
  let countryCode = _.get(payload, 'configuration.data.country', null)
  if (!countryCode) {
    ;[countryCode] = await knex('Device as d')
      .innerJoin('Geography as g', 'd.geographyId', 'g.id')
      .innerJoin('Country as c', 'g.countryId', 'c.id')
      .where('d.id', gxAlertDeviceId)
      .pluck('c.abbreviation')
  }
  const deviceName = _.get(payload, 'name', null)
  const deviceDetails = {
    partnerId,
    hostId,
    deviceSerialNumber,
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
      true
    )
    const deviceStatus = await knex('DeviceStatus')
      .where({ token: 'assigned' })
      .first('id')
    const deviceType = await knex('DeviceType')
      .where({ externalId: deviceTypeExternalId })
      .first('id')
    const [deviceId] = await knex('Device').insert({
      partnerId,
      geographyId: site.geographyId,
      siteId: site.id,
      deviceTypeId: deviceType.id,
      deviceStatusId: deviceStatus.id,
      name: deviceName,
      shortName: deviceName,
      macAddress,
      serial: payload.serial,
      hostId: _.get(payload, 'configuration.data.putInService', null),
      culture: _.get(payload, 'configuration.data.culture', null),
      timezone: _.get(payload, 'configuration.data.timezone', null),
      configurationData: JSON.stringify(
        _.get(payload, 'configuration.data', '{}')
      ),
      putInService: _.get(payload, 'configuration.data.putInService', now),
      lastSeenOn: now,
      createdOn: now,
      updatedOn: now,
    })
    await knex('DeviceStatusLog').insert({
      deviceId,
      deviceStatusId: deviceStatus.id,
      changedOn: now,
      createdOn: now,
      createdBy: null,
    })
    deviceDetails.deviceId = deviceId
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
