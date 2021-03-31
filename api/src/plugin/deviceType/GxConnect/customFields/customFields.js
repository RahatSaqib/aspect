const {
  getCustomFields: getCustomFieldsService,
} = require('../../../../forms/service')
const {
  mapGxConnectCustomFieldsWithDataSources,
} = require('./customFieldsMappingTemplates')

const getCustomFields = async (knex, partnerId, deviceId) => {
  const customFields = await getCustomFieldsService(partnerId, deviceId)
  if (customFields.fields && customFields.fields.length > 0) {
    await knex('Device')
      .update({ customFieldsSentOn: new Date() })
      .where({ id: deviceId })
    const { countryId, stateId } = await knex('Device as d')
      .join('Geography as g', 'g.id', 'd.geographyId')
      .first('g.countryId', 'g.stateId')
    return mapGxConnectCustomFieldsWithDataSources(
      customFields,
      countryId,
      stateId
    )
  }
  return null
}

module.exports = getCustomFields
