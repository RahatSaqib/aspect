const Boom = require('@hapi/boom')
const { getConstraints } = require('../auth/constraints')
const { getFormsByFormDefinitionExternalIds } = require('../forms/service')
const formsFileDictionary = require('../forms/formsFileDictionary')
const { countFormDataEntries, getFormDataEntries, getFormDataEntryById } = require('./db')

function parseMatchedFilter(value) {
  if (value === undefined) {
    return undefined
  }

  if (value === true || value === 'true') {
    return true
  }

  if (value === false || value === 'false') {
    return false
  }

  return undefined
}

function parseRow(row) {
  const parsedData = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
  return { ...row, ...parsedData }
}

/**
 * For each entry in customFieldsData, resolve field titles and display values
 * from the form definitions so the web can render them without raw JSON.
 */
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

function coerceQueryDate(value) {
  return value instanceof Date ? value : new Date(value)
}

async function listFormDataEntries(request) {
  const dataConstraints = await getConstraints(request.auth.credentials)
  const { siteId, minDate, maxDate, sampleExternalId } = request.query
  const partnerId = dataConstraints.partner.id

  /**
   * Same shape as result list (ISO with offset). Joi guarantees both are present.
   */
  const filters = {
    siteId,
    minDate: coerceQueryDate(minDate),
    maxDate: coerceQueryDate(maxDate),
    sampleExternalId,
    matched: parseMatchedFilter(request.query.matched),
  }

  const [rows, totalRow] = await Promise.all([
    getFormDataEntries(dataConstraints, filters),
    countFormDataEntries(dataConstraints, filters),
  ])

  const parsedRows = rows.map(parseRow)
  const enrichedRows = await Promise.all(parsedRows.map(row => enrichWithFormFields(row, partnerId)))

  return {
    ok: true,
    total: Number(totalRow.total || 0),
    length: enrichedRows.length,
    data: enrichedRows,
  }
}

async function showFormDataEntry(request) {
  const dataConstraints = await getConstraints(request.auth.credentials)
  const partnerId = dataConstraints.partner.id
  const row = await getFormDataEntryById(dataConstraints, request.params.id)

  if (!row) {
    throw Boom.notFound('FormData entry not found.')
  }

  const parsedRow = parseRow(row)
  const enrichedRow = await enrichWithFormFields(parsedRow, partnerId)

  return {
    ok: true,
    data: enrichedRow,
  }
}

module.exports = { listFormDataEntries, showFormDataEntry }
