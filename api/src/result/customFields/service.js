const { getResultCustomFieldsByResultIds } = require('./db')

async function getResultCustomFieldsResponseByResultIds(resultIds) {
  const resultCustomFields = await getResultCustomFieldsByResultIds(resultIds)
  const resultCustomFieldByResultId = {}
  resultCustomFields.forEach(resultCustomField => {
    if (!resultCustomFieldByResultId[resultCustomField.resultId]) {
      resultCustomFieldByResultId[resultCustomField.resultId] = {}
    }
    if (!resultCustomFieldByResultId[resultCustomField.resultId][resultCustomField.formDefinitionExternalId]) {
      resultCustomFieldByResultId[resultCustomField.resultId][resultCustomField.formDefinitionExternalId] = {}
    }
    resultCustomFieldByResultId[resultCustomField.resultId][resultCustomField.formDefinitionExternalId] = {
      ...JSON.parse(resultCustomField.customFieldsData),
      ...resultCustomFieldByResultId[resultCustomField.resultId][resultCustomField.formDefinitionExternalId],
    }
  })
  return resultCustomFieldByResultId
}

module.exports = { getResultCustomFieldsResponseByResultIds }
