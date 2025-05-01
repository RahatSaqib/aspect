const { getForms } = require('../../forms/service')

/**
 * Get custom fields by external IDs
 * @param {string} externalIds - Comma-separated list of external IDs
 * @returns {Promise<Array>} Array of custom fields
 */
async function getCustomFieldsByExternalIds(request) {
  const { externalIds } = request.query

  const externalIdsList = externalIds.split(',').map(id => id.trim())
  request.query.externalsId = externalIdsList

  const formDefinitions = await getForms(request)

  return {
    ok: true,
    data: externalIdsList.map(id => formDefinitions[id]).filter(Boolean),
  }
}

module.exports = {
  getCustomFieldsByExternalIds,
}
