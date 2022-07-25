const { getCustomFields: getCustomFieldsService } = require('../../../../forms/service')
const { mapGxConnectCustomFieldsWithDataSources } = require('./customFieldsMappingTemplates')
const gxConnectSchema = require('../../../../../jsonSchemas/gxConnectCustomFieldsSchema.json')
const validate = require('../../../../../jsonSchemas/validate')
const logger = require('../../../../shared/logger')

const getCustomFields = async (knex, partnerId, deviceId) => {
  const customFields = await getCustomFieldsService(partnerId, deviceId)
  if (customFields.fields && customFields.fields.length > 0) {
    await knex('Device').update({ customFieldsSentOn: new Date() }).where({ id: deviceId })
    const { countryId, stateId } = await knex('Device as d')
      .join('Geography as g', 'g.id', 'd.geographyId')
      .first('g.countryId', 'g.stateId')

    const mappedFields = await mapGxConnectCustomFieldsWithDataSources(customFields, {
      partnerId,
      deviceId,
      countryId,
      stateId,
    })
    if (!validate(gxConnectSchema, mappedFields)) {
      logger.error(
        `Schema validation failed for deviceId ${deviceId}. Custom fields won't be returned to GxConnect and the test details form won't be updated. Please, ensure the collection of forms are not repeating ids.`
      )
      mappedFields.CustomFields = null
    }

    return mappedFields
  }
  return null
}

module.exports = getCustomFields
