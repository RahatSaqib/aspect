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
              if (_.isPlainObject(raw) && ('value' in raw || 'key' in raw)) {
                customFieldData[payloadKey] = raw
              } else {
                customFieldData[payloadKey] = { value: raw }
              }
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
