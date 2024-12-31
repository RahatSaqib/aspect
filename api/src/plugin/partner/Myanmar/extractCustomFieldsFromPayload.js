const { getCustomFieldsFromPayload } = require('../../../forms/service')

async function extractCustomFieldsFromPayload({ payload, countryAbbreviation, partnerId, assayId, deviceId }) {
  // https://systemone.youtrack.cloud/issue/HD-15458/Myanmarsite-disable-custom-fields-for-site-SCH-Yangon
  if (deviceId === 3052) {
    return {}
  }

  const customFieldsData = await getCustomFieldsFromPayload(payload, countryAbbreviation, partnerId, assayId)
  return customFieldsData
}

module.exports = { extractCustomFieldsFromPayload }
