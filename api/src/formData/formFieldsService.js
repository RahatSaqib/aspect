const { getFormsByFormDefinitionExternalIds } = require('../forms/service')
const formsFileDictionary = require('../forms/formsFileDictionary')

/**
 * Maps a persisted FormData row into a display-ready shape. Non-entrypoint logic:
 * parses the stored `data` JSON and resolves each `customFieldsData` entry against the
 * partner's form definitions so the web can render titles and values without raw JSON.
 */

function parseRow(row) {
  const parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
  return { ...row, ...parsedData }
}

function getFieldEntryByFieldDef(fields, fieldDef) {
  if (!fields) return null

  if (Array.isArray(fields)) {
    return (
      fields.find(entry => String(entry.id) === String(fieldDef.id)) ||
      fields.find(entry => entry.name === fieldDef.name || entry.key === fieldDef.name)
    )
  }

  if (Object.prototype.hasOwnProperty.call(fields, String(fieldDef.id))) {
    return fields[String(fieldDef.id)]
  }

  if (Object.prototype.hasOwnProperty.call(fields, fieldDef.name)) {
    return fields[fieldDef.name]
  }

  return undefined
}

function resolveFieldEntry(fieldDef, fields) {
  const fieldEntry = getFieldEntryByFieldDef(fields, fieldDef)

  if (fieldEntry === undefined) {
    return null
  }

  // Stored payloads can keep field values either as primitives
  // (e.g. { "1101": "John" }) or wrapped objects ({ "1101": { value: "John" } }).
  const rawValue =
    fieldEntry &&
    typeof fieldEntry === 'object' &&
    !Array.isArray(fieldEntry) &&
    Object.prototype.hasOwnProperty.call(fieldEntry, 'value')
      ? fieldEntry.value
      : fieldEntry

  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return null
  }

  let displayValue = rawValue
  if ((fieldDef.controlType === 'comboBox' || fieldDef.controlType === 'autoComplete') && fieldDef.items) {
    const item = fieldDef.items.find(i => String(i.key) === String(rawValue))
    if (item) displayValue = item.value
  }

  return {
    id: fieldDef.id,
    title: fieldDef.title || fieldDef.caption || fieldDef.name,
    value: displayValue,
    controlType: fieldDef.controlType,
    fieldType: fieldDef.fieldType,
    order: fieldDef.order || 0,
  }
}

function resolveFormFields(customFieldsData, formsByExternalId) {
  const result = (customFieldsData || []).flatMap(({ formDefinitionExternalId, fields }) => {
    const formDef = formsByExternalId[formDefinitionExternalId]
    if (!formDef) return []
    return (formDef.fields || []).map(fieldDef => resolveFieldEntry(fieldDef, fields)).filter(Boolean)
  })

  return result.sort((a, b) => a.order - b.order)
}

function buildFallbackFormsByExternalId(externalIds) {
  return externalIds.reduce((acc, externalId) => {
    const fallbackForm = formsFileDictionary[externalId]
    if (fallbackForm) {
      acc[externalId] = fallbackForm
    }
    return acc
  }, {})
}

async function enrichWithFormFields(parsedRow, partnerId) {
  const customFieldsData = parsedRow.customFieldsData || []
  if (!customFieldsData.length) {
    return { ...parsedRow, formFields: [] }
  }

  const resolvedPartnerId = parsedRow.partnerId != null ? parsedRow.partnerId : partnerId
  if (resolvedPartnerId == null) {
    return { ...parsedRow, formFields: [] }
  }

  const externalIds = [...new Set(customFieldsData.map(e => e.formDefinitionExternalId).filter(Boolean))]
  let formsByExternalId = await getFormsByFormDefinitionExternalIds(resolvedPartnerId, externalIds)
  const hasNoResolvedForms = Object.keys(formsByExternalId || {}).length === 0
  if (hasNoResolvedForms) {
    formsByExternalId = buildFallbackFormsByExternalId(externalIds)
  }
  const formFields = resolveFormFields(customFieldsData, formsByExternalId)

  return { ...parsedRow, formFields }
}

module.exports = { parseRow, enrichWithFormFields }
