const logger = require('../../shared/logger')
const { getCustomFields } = require('../../forms/service')
const gxConnectSchema = require('../../../jsonSchemas/gxConnectCustomFieldsSchema.json')
const validate = require('../../../jsonSchemas/validate')
const {
  mapGxConnectCustomFields,
} = require('../../plugin/deviceType/GxConnect/customFields/customFieldsMappingTemplates')
const { knex } = require('../../db')
const { deviceTypeToId } = require('../../shared/dictionary')
const { updateDeviceConfiguration } = require('./shared/logic')

const handleDailyDetailsPayload = async (request, deviceLogId, remoteAddress) => {
  const { auth, payload } = request
  const { partnerId, deviceApiKeyId, deviceIds } = auth.credentials

  // This endpoint is currently used only by GxConnect devices and supports only the Cepheid GeneXpert device type.
  const deviceTypeId = await deviceTypeToId('CepheidGeneXpert')

  if (payload.configuration) {
    logger.debug('executing updateDeviceConfiguration')
    await updateDeviceConfiguration({
      knex,
      payload,
      deviceIds,
      messageContext: request.plugins.messageContext,
      remoteAddress,
    })
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

    response.deviceConfiguration = deviceConfiguration
  }

  if (payload.getFormsDefinition) {
    logger.debug('executing getCustomFieldsDefinitionForGxconnect')
    const { CustomFields } = await getCustomFieldsDefinitionForGxconnect(partnerId, deviceTypeId)

    // TODO: Reduce bandwidth by only sending custom fields when the definition was updated after this device last received them.
    await knex('Device').update({ customFieldsSentOn: new Date() }).where('deviceApiKeyId', deviceApiKeyId)
    response.CustomFields = CustomFields
  }

  await knex('DeviceLog').where('id', deviceLogId).update({
    deviceConfigurationUpdated: true,
    processed: true,
  })

  return response
}

async function processPendingDeviceConfiguration(knex, partnerId, deviceApiKeyId, deviceTypeId) {
  const { connectSettings, deviceIdsToUpdate } =
    (await knex('DeviceConfiguration as dc')
      .where({
        'dc.partnerId': partnerId,
        'dc.deviceTypeId': deviceTypeId,
      })
      .first({
        connectSettings: 'dc.data',
        deviceIdsToUpdate: knex('Device as d')
          .where({ deviceApiKeyId })
          .andWhere(qb => {
            qb.whereNull('d.connectSettingsSentOn').orWhere('d.connectSettingsSentOn', '<', knex.raw('dc.updatedOn'))
          })
          .groupBy('d.deviceApiKeyId')
          .first(knex.raw('GROUP_CONCAT(d.id)')),
      })) || {}

  if (!connectSettings || !deviceIdsToUpdate) {
    return { deviceConfiguration: null }
  }

  await knex('Device').update({ connectSettingsSentOn: new Date() }).whereIn('id', deviceIdsToUpdate.split(','))

  return { deviceConfiguration: JSON.parse(connectSettings) }
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

module.exports = {
  handleDailyDetailsPayload,
}
