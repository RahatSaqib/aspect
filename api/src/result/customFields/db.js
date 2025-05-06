const { knex } = require('../../db')

async function getResultCustomFieldsByResultIds(resultIds) {
  return knex('ResultCustomField')
    .whereIn('resultId', resultIds)
    .select('resultId', 'formDefinitionExternalId', 'customFieldsData')
}

module.exports = { getResultCustomFieldsByResultIds }
