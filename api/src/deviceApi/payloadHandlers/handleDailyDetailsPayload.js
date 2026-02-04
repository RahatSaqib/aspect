const _ = require('lodash')
const Boom = require('@hapi/boom')
const logger = require('../../shared/logger')
const { loadPlugin } = require('../../plugin/loadPlugin')
const { withPayload, addDeviceLogUpdate } = require('../deviceContext')
const { deviceMaintenanceTypeToId } = require('../../shared/dictionary')
const { parseDateOrDefault } = require('../../shared/date')
const { setDeviceCalibrationStatus, shouldTriggerModuleDisabled } = require('../../plugin/utils')
const { calibrationDateUpdated } = require('../../device/actions')
const { getCreateAssignPerson } = require('../../person/common/db')
const { getCustomFields } = require('../../forms/service')
const gxConnectSchema = require('../../../jsonSchemas/gxConnectCustomFieldsSchema.json')
const validate = require('../../../jsonSchemas/validate')
const {
  mapGxConnectCustomFields,
} = require('../../plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')

const handleDailyDetailsPayload = async (request /* , deviceLogId, remoteAddress */) => {
  const { payload } = request

  if (payload.configuration) {
    logger.debug('executing updateDeviceConfiguration')
    await updateDeviceConfiguration(withPayload(context, payload.configuration))
  }

  const response = {}
  if (payload.includeDeviceConfiguration) {
    logger.debug('executing getConnectionSettings')
    const { deviceConfiguration } = await getConnectionSettings(knex, partnerId, deviceId)
    response.deviceConfiguration = deviceConfiguration
  }

  if (payload.getFormsDefinition) {
    logger.debug('executing getFormsDefinition')
    const { CustomFields } = await getFormsDefinition(knex, partnerId, deviceId)
    response.CustomFields = CustomFields
  }

  return response
}

async function getConnectionSettings(knex, partnerId, deviceId) {
  const { data } =
    (await knex('DeviceConfiguration as dc')
      .join('Geography as g', 'g.id', 'dc.geographyId')
      .join('Device as d', 'd.deviceTypeId', 'dc.deviceTypeId')
      .join('Site as s', 'd.siteId', 's.id')
      .join('Geography as deviceGeography', 's.geographyId', 'deviceGeography.id')
      .where({
        'd.id': deviceId,
        'd.deviceTypeId': knex.raw('dc.deviceTypeId'),
        'dc.partnerId': partnerId,
        'g.countryId': knex.raw('deviceGeography.countryId'),
      })
      .andWhere(builder =>
        builder.whereNull('d.connectSettingsSentOn').orWhere('d.connectSettingsSentOn', '<', knex.raw('dc.updatedOn'))
      )
      .andWhere(builder => {
        builder
          .whereNull('g.stateId')
          .orWhere(orBuilder =>
            orBuilder.whereNotNull('g.stateId').andWhere('g.stateId', knex.raw('deviceGeography.stateId'))
          )
      })
      .orderBy('g.stateId', 'DESC')
      .first('data')) || {}

  if (!_.isEmpty(data)) await knex('Device').update({ connectSettingsSentOn: new Date() }).where({ id: deviceId })
  return { deviceConfiguration: _.isEmpty(data) ? null : JSON.parse(data) }
}

async function updateDeviceConfiguration(context) {
  const {
    knex,
    payload,
    device: { id: deviceId },
    now,
    messageContext,
  } = context

  await updateDeviceConfiguration2(knex, deviceId, payload, now, messageContext)

  addDeviceLogUpdate(context, 'deviceConfigurationUpdated', true)

  const configurationData = _.get(payload, 'configuration.data') || {}

  if (configurationData.disabledModules) {
    await Promise.each(configurationData.disabledModules, modules =>
      shouldTriggerModuleDisabled(knex, messageContext, device, modules)
    )
  }

  //
  let device = {}
  if (!_.isEmpty(_.get(payload, 'data'))) {
    const {
      data: { macAddress, hostId, culture, timezone, deviceSerialNumber, lastPingOn, state, lga, latitude, longitude },
    } = payload

    const deviceDetails = {
      hostId,
      culture,
      timezone,
      lastSeenOn: now,
      updatedOn: now,
      updatedBy: null,
    }
    if (macAddress && macAddressValid(macAddress)) {
      deviceDetails.macAddress = macAddress
    }
    if (lastPingOn) {
      deviceDetails.lastPingOn = parseDateOrDefault(lastPingOn)
    }
    if (deviceSerialNumber) {
      deviceDetails.serial = deviceSerialNumber
    }
    if (state || !_.isUndefined(latitude) || !_.isUndefined(latitude)) {
      const currentDeviceGeography = await knex('Device as d')
        .leftJoin('Site as s', 'd.siteId', 's.id')
        .leftJoin('Geography as g', 's.geographyId', 'g.id')
        .leftJoin('State as st', 'g.stateId', 'st.id')
        .leftJoin('Lga as l', 'g.lgaId', 'l.id')
        .where('d.id', deviceId)
        .first(
          'g.countryId',
          'g.stateId',
          'st.name as stateName',
          'g.lgaId',
          'l.name as lgaName',
          'd.siteId',
          's.latitude',
          's.longitude'
        )
      const siteUpdateDetails = {}
      if (!_.isEmpty(currentDeviceGeography)) {
        let newStateId = currentDeviceGeography.stateId
        let newLgaId = currentDeviceGeography.lgaId
        if (state !== currentDeviceGeography.stateName) {
          ;[newStateId] = await knex('Geography as g')
            .join('State as s', 'g.stateId', 's.id')
            .where('g.countryId', currentDeviceGeography.countryId)
            .andWhere('s.name', state)
            .pluck('s.id')
        }
        if (newStateId && lga) {
          if (lga !== currentDeviceGeography.lgaName) {
            ;[newLgaId] = await knex('Geography as g')
              .join('Lga as l', 'g.lgaId', 'l.id')
              .where('g.stateId', newStateId)
              .andWhere('l.name', lga)
              .pluck('l.id')
          } else if (newStateId !== currentDeviceGeography.stateId) {
            newLgaId = null
          }
        }
        newStateId = newStateId || null
        newLgaId = newLgaId || null
        if (newStateId !== currentDeviceGeography.stateId || newLgaId !== currentDeviceGeography.lgaId) {
          const newGeography = await knex('Geography as g')
            .where({
              countryId: currentDeviceGeography.countryId,
              stateId: newStateId,
              lgaId: newLgaId,
            })
            .first('g.id')
          if (newGeography) {
            if (currentDeviceGeography.siteId) {
              siteUpdateDetails.geographyId = newGeography.id
            }
          }
        }
        if (!_.isUndefined(latitude) && currentDeviceGeography.latitude !== latitude) {
          siteUpdateDetails.latitude = latitude
        }
        if (!_.isUndefined(longitude) && currentDeviceGeography.longitude !== longitude) {
          siteUpdateDetails.longitude = longitude
        }
        if (!_.isEmpty(siteUpdateDetails)) {
          await knex('Site').where({ id: currentDeviceGeography.siteId }).update(siteUpdateDetails)
        }
      }
    }
    if (deviceId) {
      await updateDeviceDetails(knex, deviceId, _.omitBy(deviceDetails, _.isNil), now)
    }
  }
}

const getFormsDefinition = async (knex, partnerId, deviceId) => {
  let finalCustomFields = { CustomFields: { Fields: [] } }

  const customFields = await getCustomFields(partnerId, deviceId)
  if (customFields.fields && customFields.fields.length > 0) {
    finalCustomFields = await mapGxConnectCustomFields(customFields)
    if (!validate(gxConnectSchema, finalCustomFields)) {
      logger.error(
        `Schema validation failed for deviceId ${deviceId}. Custom fields won't be returned to GxConnect and the test details form won't be updated. Please, ensure the collection of forms are not repeating ids.`
      )
      finalCustomFields.CustomFields = null
    }
  }

  await knex('Device').update({ customFieldsSentOn: new Date() }).where({ id: deviceId })
  return finalCustomFields
}

async function updateDeviceConfiguration2(knex, deviceId, payload, now, messageContext) {
  const previousConfig = await getDeviceConfiguration(knex, deviceId)
  const configurationData =
    previousConfig == null ? payload.data : _.merge(previousConfig.data, _.omitBy(payload.data, _.isNull))

  // process prop 'lastCalibrated' in 'payload', if any defined
  await tryUpdateDeviceMaintenance(knex, deviceId, payload, messageContext)

  // process props labContact* and installer* in 'payload', if any defined
  await tryAssignLabTechnicianToSite(knex, deviceId, payload)
  // finally update Device.configurationData
  await knex('Device')
    .where({ id: deviceId })
    .update({
      configurationData: JSON.stringify(configurationData),
      updatedBy: null,
      updatedOn: now,
    })

  return {}
}

// --------------------------------------------------------------------
async function tryUpdateDeviceMaintenance(knex, deviceId, payload, messageContext) {
  const {
    data: { lastCalibrated },
  } = payload
  const deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')
  const calibratedOn = lastCalibrated ? parseDateOrDefault(lastCalibrated) : null

  if (calibratedOn) {
    await setDeviceCalibrationStatus(knex, deviceId, calibratedOn, {
      deviceMaintenanceTypeId,
      notes: 'From GxConnect basic settings',
    })
    if (!messageContext.calibrationDateUpdated) {
      messageContext.bindActionCreators({
        calibrationDateUpdated,
      })
    }
    messageContext.calibrationDateUpdated(deviceId)
  }
}

// --------------------------------------------------------------------
async function tryAssignLabTechnicianToSite(knex, deviceId, payload) {
  const {
    data: {
      timezone,
      culture,
      labContactCell,
      labContactEmail,
      labContactName,
      installerCell,
      installerEmail,
      installerName,
    },
  } = payload
  if (labContactName || labContactEmail || installerName || installerEmail) {
    // get device props
    const device = await knex('Device as d')
      .join('Site as s', 'd.siteId', 's.id')
      .join('Geography as g', 's.geographyId', 'g.id')
      .where('d.id', deviceId)
      .first('g.countryId', 's.id as siteId', 'd.partnerId', 's.geographyId')
    const { countryId, partnerId, geographyId, siteId } = device || {}
    // throw error if no device found or it is not assigned to site
    if (!device || !siteId) {
      return Boom.notFound()
    }

    const baseProps = {
      countryId,
      partnerId,
      geographyId,
      siteId,
      timezone,
      culture,
    }
    await getCreateAssignPerson(knex, {
      ...baseProps,
      name: labContactName,
      email: labContactEmail,
      cell: labContactCell,
      jobFunctionExternalId: 'labUser',
    })

    await getCreateAssignPerson(knex, {
      ...baseProps,
      name: installerName,
      email: installerEmail,
      cell: installerCell,
      jobFunctionExternalId: 'technician',
    })
  }
}

async function getDeviceConfiguration(knex, deviceId) {
  const deviceQuery = knex('Device as d').first('d.configurationData').where({ id: deviceId })
  const deviceConfiguration = await getDeviceConfigurationFromQuery(deviceQuery)
  return deviceConfiguration
}

async function getDeviceConfigurationFromQuery(deviceQuery) {
  const device = await deviceQuery
  if (device == null || device.configurationData == null) {
    return null
  }
  // Exclude 'latestErrors' from 'configurationData' in the response to reduce network data usage
  return { data: _.omit(JSON.parse(device.configurationData), ['latestErrors']) }
}

async function updateDeviceDetails(knex, deviceId, deviceDetails, now) {
  // Compare existing device to these details
  // which field vakues are different?
  const existingDevice = await knex('Device as d').where({ 'd.id': deviceId }).first()
  /* validates if the tz is included in our db */
  if (deviceDetails.timezone && existingDevice.timezone !== deviceDetails.timezone) {
    const { timeZone: defaultTimeZone } =
      (await knex('Site as s')
        .join('Geography as g', 's.geographyId', 'g.id')
        .join('Country as c', 'g.countryId', 'c.id')
        .where('s.id', existingDevice.siteId)
        .first(knex.raw('COALESCE(s.timezoneId, c.timezone) as timeZone'))) ||
      (await knex('Country as c').first('c.timezone as timeZone'))
    const { existingTimeZone } = (await knex('TimeZone')
      .where('id', deviceDetails.timezone)
      .first('id as existingTimeZone')) || {
      existingTimeZone: defaultTimeZone,
    }

    deviceDetails.timezone = existingTimeZone
  }
  const changedDetails = _.omitBy(
    deviceDetails,
    (v, k) => ['id', 'createdOn', 'createdBy'].includes(k) || existingDevice[k] == v // eslint-disable-line eqeqeq
  )
  if (!_.isEmpty(changedDetails)) {
    await knex('Device')
      .where({ id: deviceId })
      .update(
        _.merge({}, changedDetails, {
          updatedBy: null,
          updatedOn: now,
        })
      )
  }
}

function macAddressValid(macAddress) {
  return (
    !_.isEmpty(macAddress) &&
    macAddress.indexOf('MAC') === 0 &&
    macAddress.trim().length > 3 &&
    macAddress !== 'MAC005345000000'
  )
}

module.exports = {
  handleDailyDetailsPayload,
}
