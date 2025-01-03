const { getCustomFieldsFromPayload } = require('../../../forms/service')

async function extractCustomFieldsFromPayload({ payload, countryAbbreviation, partnerId, assayId }) {
  const customFieldsData = await getCustomFieldsFromPayload(payload, countryAbbreviation, partnerId, assayId)
  return customFieldsData
}

module.exports = { extractCustomFieldsFromPayload }
