const { getCustomFields } = require('../../../../forms/service')
const { mapGxConnectCustomFields } = require('./customFieldsMappingTemplates')
const gxConnectSchema = require('../../../../../jsonSchemas/gxConnectCustomFieldsSchema.json')
const validate = require('../../../../../jsonSchemas/validate')
const logger = require('../../../../shared/logger')

/*
 * Builds the list of custom fields with the corresponding format for a GxConnect device. In addInstrumentationHandler, updates the date when the device downloaded the custom fields.
 * @param {*} knex
 * @param {*} partnerId
 * @param {*} deviceId
 * @returns An array with the list of custom fields
 */
const getCustomFieldsForGxConnect = async (knex, partnerId, deviceId) => {
  let customFieldsFoxGxConnect = { CustomFields: { Fields: [] } }

  const customFields = await getCustomFields(partnerId, deviceId)
  if (customFields.fields && customFields.fields.length > 0) {
    customFieldsFoxGxConnect = await mapGxConnectCustomFields(customFields)
    if (!validate(gxConnectSchema, customFieldsFoxGxConnect)) {
      logger.error(
        `Schema validation failed for deviceId ${deviceId}. Custom fields won't be returned to GxConnect and the test details form won't be updated. Please, ensure the collection of forms are not repeating ids.`
      )
      customFieldsFoxGxConnect.CustomFields = null
    }
  }

  await knex('Device').update({ customFieldsSentOn: new Date() }).where({ id: deviceId })
  return customFieldsFoxGxConnect
}

module.exports = getCustomFieldsForGxConnect
