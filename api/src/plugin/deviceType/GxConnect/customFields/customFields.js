const {
  getCustomFields: getCustomFieldsService,
} = require('../../../../forms/service')
const {
  mapGxConnectCustomFieldsWithDataSources,
} = require('./customFieldsMappingTemplates')
// const gxConnectSchema = require('../../../../../jsonSchemas/gxConnectCustomFieldsSchema.json')
// const validate = require('../../../../../jsonSchemas/validate')

const getCustomFields = async (knex, partnerId, deviceId) => {
  const customFields = await getCustomFieldsService(partnerId, deviceId)
  if (customFields.fields && customFields.fields.length > 0) {
    await knex('Device')
      .update({ customFieldsSentOn: new Date() })
      .where({ id: deviceId })
    const { countryId, stateId } = await knex('Device as d')
      .join('Geography as g', 'g.id', 'd.geographyId')
      .first('g.countryId', 'g.stateId')

    const mappedFields = mapGxConnectCustomFieldsWithDataSources(
      customFields,
      countryId,
      stateId
    )
    // const isValid = validate(gxConnectSchema, mappedFields)

    return mappedFields
  }
  return null
}

module.exports = getCustomFields
