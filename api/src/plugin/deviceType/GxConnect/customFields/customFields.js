const {
  getCustomFields: getCustomFieldsService,
} = require('../../../../forms/service')
const mapGxConnectCustomFields = require('./customFieldsMappingTemplates')
const { knex } = require('../../../../db')

const getCustomFields = async (partnerId, deviceId) => {
  // TODO
  await knex('Device').update()
  const customFields = await getCustomFieldsService(partnerId, deviceId)
  return mapGxConnectCustomFields(customFields)
}

module.exports = getCustomFields
