const _ = require('lodash')
const { getCustomFieldsFromPayload, getFormsByFormDefinitionExternalIds } = require('../../forms/service')

/**
 * TrueConnect / FormData custom-field representation → Result-shaped fragments.
 * Not an HTTP or MQ entrypoint: used when linking FormData to results (upsert, RESULT_LOGGED).
 */

/**
 * Read a single field value from TrueConnect `fields` objects (keys by field id or name).
 */
function resolveTrueConnectFieldValue(field, fieldsBag) {
  if (!fieldsBag || typeof fieldsBag !== 'object') {
    return undefined
  }
  const candidates = []
  if (field.id != null && field.id !== '') {
    candidates.push(fieldsBag[field.id], fieldsBag[String(field.id)])
  }
  if (field.name) {
    candidates.push(fieldsBag[field.name])
  }
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    if (c !== undefined && c !== null) {
      return c
    }
  }
  return undefined
}

function valuesMatch(a, b) {
  if (a === b) {
    return true
  }
  if (a == null || b == null) {
    return false
  }
  return String(a) === String(b)
}

function resolveFieldItem(field, rawValue) {
  if (!Array.isArray(field.items)) {
    return null
  }
  return _.find(field.items, item => valuesMatch(item.key, rawValue) || valuesMatch(item.value, rawValue)) || null
}

function normalizeTrueConnectFieldValue(field, raw) {
  if (_.isPlainObject(raw) && ('value' in raw || 'key' in raw)) {
    const item = resolveFieldItem(field, raw.key)
    if (item) {
      return { ...raw, key: item.key, value: item.value }
    }
    const itemFromValue = resolveFieldItem(field, raw.value)
    if (itemFromValue) {
      return { ...raw, key: itemFromValue.key, value: itemFromValue.value }
    }
    return raw
  }

  const item = resolveFieldItem(field, raw)
  if (item) {
    return { key: item.key, value: item.value }
  }
  return { value: raw }
}

/**
 * Shape TrueConnect `customFieldsData` into a GxConnect-style payload for `getCustomFieldsFromPayload`.
 */
function buildGxPayloadFromTrueConnectCustomFieldsData(customFieldsData, formsByExternalId) {
  const customFieldData = {}
  if (!Array.isArray(customFieldsData)) {
    return { data: { customFieldData } }
  }
  for (const entry of customFieldsData) {
    if (entry && entry.formDefinitionExternalId) {
      const form = formsByExternalId[entry.formDefinitionExternalId]
      if (form && Array.isArray(form.fields)) {
        const fieldsBag = entry.fields || {}
        for (const field of form.fields) {
          const raw = resolveTrueConnectFieldValue(field, fieldsBag)
          if (raw !== undefined) {
            const payloadKey = field.id != null && field.id !== '' ? field.id : field.name
            if (payloadKey != null && payloadKey !== '') {
              customFieldData[payloadKey] = normalizeTrueConnectFieldValue(field, raw)
            }
          }
        }
      }
    }
  }
  return { data: { customFieldData } }
}

/**
 * Map TrueConnect FormData.customFieldsData to Result column fragments (same rules as Gx device payloads).
 */
async function getCustomFieldsFromTrueConnectFormData(
  customFieldsData,
  countryAbbreviation,
  partnerId,
  assayId,
  diseaseId = null
) {
  const externalIds = _.uniq(
    _.map(
      _.filter(customFieldsData, e => e && e.formDefinitionExternalId),
      'formDefinitionExternalId'
    )
  )
  const formsByExternalId = await getFormsByFormDefinitionExternalIds(partnerId, externalIds)
  const payload = buildGxPayloadFromTrueConnectCustomFieldsData(customFieldsData, formsByExternalId)
  return getCustomFieldsFromPayload(payload, countryAbbreviation, partnerId, assayId, diseaseId, {
    includeZeroAndFalse: true,
  })
}

module.exports = {
  getCustomFieldsFromTrueConnectFormData,
}
