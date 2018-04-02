const _ = require('lodash')
const Boom = require('boom')
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
  let countryAbbreviation = _.get(payload, 'configuration.data.country', null)
  if (!countryAbbreviation) {
    ;[countryAbbreviation] = await knex('device as d')
      .innerJoin('Geography as g', 'd.geographyId', 'g.id')
      .innerJoin('Country as c', 'g.countryId', 'c.id')
      .where('d.id', gxAlertDeviceId)
      .pluck('c.abbreviation')
  }
  const deviceNameFromGxAlert = _.get(payload, 'name', null)
  const deviceDetails = {
    partnerId,
    hostId,
    deviceSerialNumber,
    countryAbbreviation,
    macAddress,
    deviceName: deviceNameFromGxAlert,
    deviceIdFromGxAlertSource,
  }
  let matchingDevices = await findDevices(deviceDetails, knex)
  if (_.isEmpty(matchingDevices)) {
    const site = await getOrCreateSite(
      knex,
      payload,
      gxAlertDevice,
      now,
      countryAbbreviation,
      deviceNameFromGxAlert
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
      name: deviceNameFromGxAlert,
      shortName: deviceNameFromGxAlert,
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
        name: deviceNameFromGxAlert,
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

async function getOrCreateSite(
  knex,
  payload,
  gxAlertDevice,
  now,
  countryAbbreviation,
  deviceNameFromGxAlert
) {
  let site = null
  if (deviceNameFromGxAlert && countryAbbreviation) {
    const sites = await knex
      .from('Site as s')
      .join('Geography as g', 's.geographyId', 'g.id')
      .join('Country as c', 'g.countryId', 'c.id')
      .where({
        's.partnerId': gxAlertDevice.partnerId,
        'c.abbreviation': countryAbbreviation,
      })
      .andWhere(function() {
        this.where({ 's.name': deviceNameFromGxAlert })
          .orWhere({ 's.shortName': deviceNameFromGxAlert })
          .orWhere({ 's.externalId': deviceNameFromGxAlert })
      })
      .select('s.*')
    if (sites.length === 1) {
      site = _.head(sites)
    } else if (sites.length > 1) {
      throw Boom.conflict(
        `Cannot uniquely determine which site this request came from using ${deviceNameFromGxAlert} in ${countryAbbreviation})`
      )
    }
    if (!site) {
      // If we cannot determine the site by name or external ID
      // create a new site
      const { countryId } = await knex
        .from('Country as c')
        .where({ abbreviation: countryAbbreviation })
        .first('c.id as countryId')
      if (!countryId) {
        throw Boom.notFound(
          `Cannot determine the country from ${countryAbbreviation}.`
        )
      }
      const geography = await knex
        .from('Geography as g')
        .where({ 'g.countryId': countryId })
        .whereNull('g.stateId')
        .whereNull('g.lgaId')
        .first('g.id')
      if (_.isEmpty(geography)) {
        const [id] = await knex('Geography').insert({ countryId })
        geography.id = id
      }

      const newSite = {
        name: deviceNameFromGxAlert,
        shortName: deviceNameFromGxAlert,
        externalId: deviceNameFromGxAlert,
        partnerId: gxAlertDevice.partnerId,
        geographyId: geography.id,
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
      const [id] = await knex.insert(newSite).into('Site')
      site = await knex
        .from('Site')
        .where('id', id)
        .first()
    }
  } else {
    throw Boom.notFound('Cannot determine which site this request came from')
  }
  return site
}

module.exports = preProcessAddDeviceData
