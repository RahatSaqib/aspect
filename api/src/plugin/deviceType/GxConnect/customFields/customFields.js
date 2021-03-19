const {
  getCustomFields: getCustomFieldsService,
} = require('../../../../forms/service')
const mapGxConnectCustomFields = require('./customFieldsMappingTemplates')

const getCustomFields = async ({ knex, partnerId, deviceId }) => {
  const customFields = await getCustomFieldsService({
    knex,
    deviceId,
    partnerId,
  })

  return mapGxConnectCustomFields(customFields)
}

module.exports = getCustomFields
