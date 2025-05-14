const { getForms } = require('../../forms/service')

/**
 * Get custom fields by external IDs
 * @param {string} externalIds - Comma-separated list of external IDs
 * @returns {Promise<Array>} Array of custom fields
 */
async function getCustomFieldsByExternalIds(request) {
  const { externalIds } = request.query

  request.query.externalsId = externalIds

  const formDefinitions = await getForms(request)

  return {
    ok: true,
    data: externalIds?.map(id => formDefinitions[id]).filter(Boolean),
  }
}

module.exports = {
  getCustomFieldsByExternalIds,
}
