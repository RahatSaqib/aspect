const {
  getCustomFields: getCustomFieldsService,
} = require('../../../../forms/service')
const mapGxConnectCustomFields = require('./customFieldsMappingTemplates')

const getCustomFields = async (partnerId, deviceId) => {
  const customFields = await getCustomFieldsService(partnerId, deviceId)
  return mapGxConnectCustomFields(customFields)
}

module.exports = getCustomFields
