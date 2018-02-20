const _ = require('lodash')
const Boom = require('boom')
const genexpertPreProcessAddDeviceData = require('../preProcessAddDeviceData')

async function preProcessAddDeviceData(context) {
  const { device, payload, knex, now } = context
  // Get or create source device
  // GxAlert forwards data from source devices.
  // We want the context's device to be replaced with the source device
  const geneXpertDevice = await getOrCreateDevice(knex, payload, device, now)
  if (!_.isEmpty(geneXpertDevice)) {
    context.device = geneXpertDevice
  } else {
    throw Boom.badData(`Cannot find or create device with the provided data`)
  }
  await genexpertPreProcessAddDeviceData(context)
}

async function getOrCreateDevice(knex, payload, gxAlertDevice, now) {
  const gxAlertDeviceId = _.get(
    payload,
    'configuration.data.gxAlertDeviceId',
    null
  )
  if (!gxAlertDeviceId) {
    throw Boom.badRequest(
      'Must specify GxAlert device ID for data from GxAlert'
    )
  }
  const deviceQueryStart = knex('Device as d')
    .innerJoin('DeviceStatus as ds', 'd.deviceStatusId', 'ds.id')
    .innerJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
    .innerJoin('DeviceTypeCategory as dtc', 'dtc.id', 'dt.deviceTypeCategoryId')

  const deviceQuerySelectFields = [
    'd.id',
    'd.name',
    'd.macAddress',
    'd.serial',
    'd.partnerId',
    'd.siteId',
    'ds.token as status',
    'dt.externalId as deviceType',
    'dt.plugin as deviceTypePluginName',
    'dtc.name as deviceTypeCategory',
  ]
  const deviceFromGxAlert = await deviceQueryStart
    .clone()
    .whereRaw(
      'JSON_EXTRACT(d.configurationData, "$.gxAlertDeviceId") = ?',
      gxAlertDeviceId
    )
    .first(deviceQuerySelectFields)
  if (!_.isEmpty(deviceFromGxAlert)) {
    return deviceFromGxAlert
  }

  const deviceTypeExternalId = _.get(payload, 'type.id', null)
  if (!deviceTypeExternalId) {
    throw Boom.badRequest('Must specify device type for data from GxAlert')
  }
  const macAddress = _.get(payload, 'configuration.data.gxAlertDeviceId', null)
  let countryAbbreviation = _.get(payload, 'configuration.data.country', null)
  if (!countryAbbreviation) {
    ;[countryAbbreviation] = await knex('device as d')
      .innerJoin('Geography as g', 'd.geographyId', 'g.id')
      .innerJoin('Country as c', 'g.countryId', 'c.id')
      .where('d.id', gxAlertDevice.id)
      .select('c.abbreviation')
      .map(row => row.abbreviation)
  }
  const deviceNameFromGxAlert = _.get(payload, 'name', null)
  const matchingDevices = await deviceQueryStart
    .clone()
    .innerJoin('Geography as g', 'd.geographyId', 'g.id')
    .innerJoin('Country as c', 'g.countryId', 'c.id')
    .where(function() {
      if (macAddress) {
        this.where('d.macAddress', macAddress)
      }
    })
    .orWhere(function() {
      if (countryAbbreviation && deviceNameFromGxAlert) {
        this.where('c.abbreviation', countryAbbreviation)
        this.andWhere(function() {
          this.where('d.name', deviceNameFromGxAlert)
          this.orWhere('d.shortName', deviceNameFromGxAlert)
        })
      }
    })
    .select(deviceQuerySelectFields)
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
      .where({ token: 'provisioned' })
      .first('id')
    const deviceType = await knex('DeviceType')
      .where({ externalId: deviceTypeExternalId })
      .first('id')
    const [deviceId] = await knex('Device').insert({
      partnerId: gxAlertDevice.partnerId,
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
    return deviceQueryStart
      .clone()
      .where('d.id', deviceId)
      .first(deviceQuerySelectFields)
  } else if (matchingDevices.length === 1) {
    return matchingDevices[0]
  } else if (macAddress) {
    return _.first(matchingDevices, { macAddress })
  } else if (deviceNameFromGxAlert) {
    return _.first(matchingDevices, { name: deviceNameFromGxAlert })
  }
  return null
}

async function getOrCreateSite(
  knex,
  payload,
  gxAlertDevice,
  now,
  countryAbbreviation,
  deviceNameFromGxAlert
) {
  const site = {}
  if (deviceNameFromGxAlert && countryAbbreviation) {
    const siteIds = await knex
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
      .select('s.id')
    if (siteIds.length === 1) {
      site.id = siteIds[0].id
    } else if (siteIds.length > 1) {
      throw Boom.conflict(
        `Cannot uniquely determine which site this request came from using ${deviceNameFromGxAlert} in ${countryAbbreviation})`
      )
    }
    if (!site.id) {
      // If we cannot determine the site by name or external ID
      // create a new site
      const [{ countryId }] = await knex
        .from('Country as c')
        .where({ abbreviation: countryAbbreviation })
        .select('c.id as countryId')
      if (!countryId) {
        throw Boom.notFound(
          `Cannot determine the country from ${countryAbbreviation}.`
        )
      }
      const [geography] = await knex
        .from('Geography as g')
        .where({ 'g.countryId': countryId })
        .whereNull('g.stateId')
        .whereNull('g.lgaId')
        .select('g.id')
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
      site.id = id
    }
  } else {
    throw Boom.notFound('Cannot determine which site this request came from')
  }
  return site
}

module.exports = preProcessAddDeviceData
