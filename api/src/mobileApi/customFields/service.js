const { pick, sortBy } = require('lodash')
const { getForms } = require('../../forms/service')

function mapFormToCustomFieldsPayload(form) {
  return {
    formDefinitionExternalId: form.formDefinitionExternalId,
    assayExternalId: form.assayExternalId,
    diseaseExternalId: form.diseaseExternalId,
    fields: form.fields.map(field =>
      pick(field, [
        'id',
        'name',
        'title',
        'fieldType',
        'order',
        'controlType',
        'mandatory',
        'validation',
        'condition',
        'items',
      ])
    ),
  }
}

/**
 * Get custom field form definitions for the partner.
 * When `externalIds` is provided, returns only those definitions (in request order).
 * When omitted or empty, returns every form definition the partner has (same scope as getForms).
 */
async function getCustomFieldsByExternalIds(request) {
  const { externalIds } = request.query

  if (Array.isArray(externalIds) && externalIds.length > 0) {
    request.query.externalsId = externalIds
  }

  const formDefinitions = await getForms(request)

  let formsToSerialize
  if (Array.isArray(externalIds) && externalIds.length > 0) {
    formsToSerialize = externalIds.map(id => formDefinitions[id]).filter(Boolean)
  } else {
    formsToSerialize = sortBy(Object.values(formDefinitions), f => f.formDefinitionExternalId)
  }

  return {
    ok: true,
    data: formsToSerialize.map(mapFormToCustomFieldsPayload),
  }
}

module.exports = {
  getCustomFieldsByExternalIds,
}
