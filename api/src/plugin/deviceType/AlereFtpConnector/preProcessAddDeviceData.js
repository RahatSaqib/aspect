const _ = require('lodash')
const Boom = require('boom')
const { createNewDevice } = require('../../../deviceApi/device')

async function preProcessAddDeviceData(context) {
  const { device, payload, knex, now } = context
  // Get or create source device
  // The Alere FTP Connector forwards data from source devices.
  // We want the context's device to be replaced with the source device
  const alereDevice = await getOrCreateDevice(knex, payload, device, now)
  if (!_.isEmpty(alereDevice)) {
    alereDevice.deviceTypePluginName = device.deviceTypePluginName
    context.device = alereDevice
  } else {
    throw Boom.badData(`Cannot find or create device with the provided data`)
  }
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${JSON.stringify(device)}`)
  }
  const site = await getOrCreateSite(
    knex,
    device,
    { deviceId: alereDevice.id, serial: alereDevice.serial },
    now
  )
  const { startedOn: firstTestDate } = (await knex
    .from('Result')
    .where('deviceId', alereDevice.id)
    .orderBy('startedOn', 'desc')
    .first('startedOn')) || { startedOn: null }
  if (
    alereDevice.siteId !== site.id ||
    alereDevice.geographyId !== site.geographyId ||
    alereDevice.putInService !== firstTestDate
  ) {
    await knex
      .from('Device')
      .where({ id: alereDevice.id })
      .update({
        siteId: site.id,
        geographyId: site.geographyId,
        putInService: firstTestDate,
        updatedOn: now,
        updatedBy: null,
      })
  }
}

async function getOrCreateDevice(knex, payload, alereFtpConnectorDevice, now) {
  const { partnerId } = alereFtpConnectorDevice
  const deviceTypeExternalId = _.get(payload, 'type.id', null)
  if (!deviceTypeExternalId) {
    throw Boom.badRequest(
      'Must specify device type for data from an Alere FTP Connector'
    )
  }
  const deviceSerialNumber = _.get(payload, 'result.instrument.serial', null)
  const deviceDetails = {
    partnerId,
    serial: deviceSerialNumber,
    deviceTypeExternalId,
  }
  let matchingDevices = await findDevices(deviceDetails, knex)

  if (_.isEmpty(matchingDevices)) {
    const site = await getOrCreateSite(
      knex,
      alereFtpConnectorDevice,
      { serial: deviceSerialNumber },
      now
    )
    const { device, error } = await createNewDevice(knex, now, {
      deviceTypeExternalId,
      serial: deviceSerialNumber,
      partnerId,
      siteId: site.id,
      geographyId: site.geographyId,
      status: 'assigned',
      culture: alereFtpConnectorDevice.culture,
      timezone: alereFtpConnectorDevice.timezone,
    })
    if (error) {
      throw error
    }
    deviceDetails.deviceId = device.id
    matchingDevices = await findDevices(deviceDetails, knex)
  }
  let matchingDevice = null
  if (matchingDevices.length === 1) {
    ;[matchingDevice] = matchingDevices
  }
  return matchingDevice
}

async function findDevices(
  { deviceId, partnerId, serial, deviceTypeExternalId },
  knex
) {
  return knex
    .from('Device as d')
    .leftJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .leftJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')
    .where(function() {
      if (deviceId) {
        this.where('d.id', deviceId)
      } else {
        this.where('d.partnerId', partnerId)
        if (serial) {
          this.andWhere('d.serial', serial)
        }
        if (deviceTypeExternalId) {
          this.where('dt.externalId', deviceTypeExternalId)
        }
      }
    })
    .select(
      'd.id',
      'd.partnerId',
      'd.siteId',
      'd.geographyId',
      'd.name',
      'd.serial',
      'd.macAddress',
      'd.configurationData',
      'd.lastSeenOn',
      'd.putInService',
      'ds.token as status',
      'dt.externalId as deviceType',
      'dt.plugin as deviceTypePluginName',
      'dtc.name as deviceTypeCategory'
    )
}

async function getOrCreateSite(
  knex,
  alereFtpConnectorDevice,
  deviceDetails,
  now
) {
  const { deviceId, serial } = deviceDetails
  const { partnerId } = alereFtpConnectorDevice
  let matchingSites = []
  if (deviceId) {
    matchingSites = await knex
      .from('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .where('d.id', deviceId)
      .select('s.*')
  }
  if (_.isEmpty(matchingSites)) {
    matchingSites = await knex
      .from('Site as s')
      .where({
        's.partnerId': partnerId,
      })
      .andWhere(function() {
        this.where({ 's.name': serial })
          .orWhere({ 's.shortName': serial })
          .orWhere({ 's.externalId': serial })
      })
      .select()
  }
  if (_.isEmpty(matchingSites)) {
    const newSite = {
      name: serial,
      shortName: serial,
      externalId: serial,
      partnerId,
      createdOn: now,
      updatedOn: now,
    }
    if (newSite.name.length > 255) {
      newSite.name = newSite.name.substr(0, 255)
    }
    if (newSite.shortName.length > 45) {
      newSite.shortName = newSite.shortName.substr(0, 45)
    }
    if (newSite.externalId.length > 255) {
      newSite.externalId = newSite.externalId.substr(0, 255)
    }
    const [siteId] = await knex.insert(newSite).into('Site')
    matchingSites = await knex
      .from('Site as s')
      .where('s.id', siteId)
      .select()
  }
  let matchingSite = null
  if (matchingSites.length === 1) {
    ;[matchingSite] = matchingSites
  }
  return matchingSite
}

module.exports = preProcessAddDeviceData
