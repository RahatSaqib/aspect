const _ = require('lodash')
const Boom = require('@hapi/boom')
const logger = require('../../shared/logger')
const { loadPlugin } = require('../../plugin/loadPlugin')
const { withPayload, addDeviceLogUpdate } = require('../deviceContext')
const { deviceMaintenanceTypeToId } = require('../../shared/dictionary')
const { parseDateOrDefault } = require('../../shared/date')
const { setDeviceCalibrationStatus } = require('../../plugin/utils')
const { calibrationDateUpdated } = require('../../device/actions')
const { getCreateAssignPerson } = require('../../person/common/db')

const handleDailyDetailsPayload = async (request, deviceLogId, remoteAddress) => {
  const { payload } = request

  const handlers = [
    {
      name: 'updateDeviceConfigurationWithContext',
      when: payload.configuration,
      run: () => updateDeviceConfigurationWithContext(withPayload(context, payload.configuration)),
    },
    {
      name: 'getConnectionSettings',
      when: payload.includeDeviceConfiguration,
      run: () => getConnectionSettings(context),
    },
    {
      name: 'getCustomFields',
      when: payload.getFormsDefinition,
      run: () => getCustomFields(context),
    },
  ]

  let response = {}
  for (const handler of handlers) {
    // eslint-disable-next-line no-continue
    if (!handler.when) continue

    if (handler.name) {
      logger.debug(`executing ${handler.name}`)
    }

    response = {
      ...response,
      // eslint-disable-next-line no-await-in-loop
      ...(await handler.run()),
    }
  }

  return response
}

async function getConnectionSettings(context) {
  const {
    knex,
    device: { id: deviceId, partnerId },
  } = context
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

async function updateDeviceConfigurationWithContext(context) {
  const {
    knex,
    payload,
    device: { id: deviceId },
    now,
    partnerPluginName,
    deviceTypePluginName,
    messageContext,
  } = context
  const preProcess = await loadPlugin(partnerPluginName, deviceTypePluginName, 'preProcessUpdateDeviceConfiguration')
  await preProcess(context)

  await updateDeviceConfiguration(knex, deviceId, payload, now, messageContext)
  addDeviceLogUpdate(context, 'deviceConfigurationUpdated', true)
  const postProcess = await loadPlugin(partnerPluginName, deviceTypePluginName, 'postProcessUpdateDeviceConfiguration')
  const postProcessResult = await postProcess(context)

  return postProcessResult
}

const getCustomFields = async context => {
  const {
    knex,
    device: { id: deviceId, partnerId },
    partnerPluginName,
    deviceTypePluginName,
  } = context
  let CustomFields = null
  const customFields = await loadPlugin(partnerPluginName, deviceTypePluginName, 'getCustomFields')
  if (customFields) CustomFields = _.get(await customFields(knex, partnerId, deviceId), 'CustomFields')
  return { CustomFields }
}

async function updateDeviceConfiguration(knex, deviceId, payload, now, messageContext) {
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

module.exports = {
  handleDailyDetailsPayload,
}
