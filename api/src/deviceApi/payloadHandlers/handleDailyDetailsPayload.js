const _ = require('lodash')
const Boom = require('@hapi/boom')
const logger = require('../../shared/logger')
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
const { knex } = require('../../db')
const { deviceTypeToId } = require('../../shared/dictionary')

const handleDailyDetailsPayload = async (request, deviceLogId /* , remoteAddress */) => {
  const { auth, payload } = request
  const { partnerId, deviceApiKeyId, devicesIds } = auth.credentials

  // This endpoint is currently used only by GxConnect devices and supports only the Cepheid GeneXpert device type.
  const deviceTypeId = await deviceTypeToId('CepheidGeneXpert')

  if (payload.configuration) {
    logger.debug('executing updateDeviceConfiguration')
    await updateDeviceConfiguration({ knex, payload, devicesIds, messageContext: request.plugins.messageContext })
  }

  const response = {}
  if (payload.includeDeviceConfiguration) {
    logger.debug('executing processPendingDeviceConfiguration')
    const { deviceConfiguration } = await processPendingDeviceConfiguration(
      knex,
      partnerId,
      deviceApiKeyId,
      deviceTypeId
    )

    if (deviceConfiguration) {
      response.deviceConfiguration = deviceConfiguration
    }
  }

  if (payload.getFormsDefinition) {
    logger.debug('executing getCustomFieldsDefinitionForGxconnect')
    const { CustomFields } = await getCustomFieldsDefinitionForGxconnect(partnerId, deviceTypeId)
    await knex('Device').update({ customFieldsSentOn: new Date() }).whereIn({ deviceApiKeyId })
    response.CustomFields = CustomFields
  }

  await knex('DeviceLog').where('id', deviceLogId).update({
    deviceConfigurationUpdated: true,
    processed: true,
  })

  return response
}

async function processPendingDeviceConfiguration(knex, partnerId, deviceApiKeyId, deviceTypeId) {
  const { connectSettings, devicesIdsToUpdate } =
    (await knex('DeviceConfiguration as dc')
      .where({
        'd.partnerId': partnerId,
        'd.deviceTypeId': deviceTypeId,
      })
      .first({
        connectSettings: 'dc.data',
        devicesIdsToUpdate: knex('Device as d')
          .where({ deviceApiKeyId })
          .andWhere(qb => {
            qb.whereNull('d.connectSettingsSentOn').orWhere('d.connectSettingsSentOn', '<', knex.raw('dc.updatedOn'))
          })
          .groupBy('d.deviceApiKeyId')
          .pluck('d.id'),
      })) || {}

  if (!connectSettings || !devicesIdsToUpdate) {
    return { deviceConfiguration: null }
  }

  await knex('Device').update({ connectSettingsSentOn: new Date() }).whereIn('id', devicesIdsToUpdate.split(','))

  return { deviceConfiguration: JSON.parse(connectSettings) }
}

async function updateDeviceConfiguration({ knex, payload, devicesIds, messageContext }) {
  const now = new Date()
  const configurationData = _.omitBy(payload.configuration.data, _.isNull)

  // const deviceId = 0

  // process prop 'lastCalibrated' in 'payload', if any defined
  await tryUpdateDeviceMaintenance(knex, deviceId, payload.configuration, messageContext)

  // process props labContact* and installer* in 'payload', if any defined
  await tryAssignLabTechnicianToSite(knex, deviceId, payload.configuration)

  // Update device configuration data
  await knex('Device')
    .whereIn('id', devicesIds)
    .update({
      configurationData: knex.raw(
        'JSON_MERGE_PATCH(IFNULL(configurationData, "{}"), ?)',
        JSON.stringify(configurationData)
      ),
      updatedBy: null,
      updatedOn: now,
    })

  if (configurationData.disabledModules) {
    await Promise.each(configurationData.disabledModules, modules =>
      shouldTriggerModuleDisabled(knex, messageContext, device, modules)
    )
  }

  //
  let device = {}
  if (!_.isEmpty(_.get(payload, 'configuration.data'))) {
    const {
      data: { macAddress, hostId, culture, timezone, deviceSerialNumber, lastPingOn },
    } = payload.configuration

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
    if (deviceId) {
      await knex('Device')
        .where({ id: deviceId })
        .update({ ...deviceDetails, updatedBy: null, updatedOn: now })
    }
  }
  // Exclude 'latestErrors' from 'configurationData' in the response to reduce network data usage
}

const getCustomFieldsDefinitionForGxconnect = async (partnerId, deviceTypeId) => {
  const customFields = await getCustomFields(partnerId, deviceTypeId)
  if (!customFields.fields || customFields.fields.length === 0) {
    return { CustomFields: null }
  }

  /*
   * The Aspect custom-fields schema differs from the GxConnect format
   * so we convert it and validate against the schema.
   */
  const customFieldsForGxConnect = await mapGxConnectCustomFields(customFields)
  if (!validate(gxConnectSchema, customFieldsForGxConnect)) {
    logger.error(
      `Schema validation failed for partnerId ${partnerId} and deviceTypeId ${deviceTypeId}. ` +
        "Custom fields won't be returned to GxConnect and the test details form won't be updated. " +
        'Please, ensure the collection of forms are not repeating ids.'
    )
    return { CustomFields: null }
  }

  return customFieldsForGxConnect
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
