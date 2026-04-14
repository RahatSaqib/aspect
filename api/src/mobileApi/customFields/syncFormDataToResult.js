const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getCustomFieldsFromTrueConnectFormData } = require('./trueConnectCustomFieldsMapping')
const logger = require('../../shared/logger')

function safeJsonParse(str, fallback = {}) {
  if (str == null || str === '') {
    return fallback
  }
  if (typeof str === 'object') {
    return _.isPlainObject(str) ? str : fallback
  }
  try {
    const o = JSON.parse(str)
    return _.isPlainObject(o) ? o : fallback
  } catch {
    return fallback
  }
}

function parseFormDataContent(data) {
  if (data == null) {
    return {}
  }
  if (typeof data === 'object') {
    return data
  }
  return safeJsonParse(data, {})
}

async function loadResultSyncContext(trx, resultId) {
  return trx('Result as r')
    .leftJoin('Site as si', 'si.id', 'r.siteId')
    .leftJoin('Geography as g', 'g.id', 'si.geographyId')
    .leftJoin('Country as c', 'c.id', 'g.countryId')
    .leftJoin('Assay as a', 'a.id', 'r.assayId')
    .leftJoin('AssayType as at', 'at.id', 'a.assayTypeId')
    .where('r.id', resultId)
    .first(
      'r.partnerId',
      'r.assayId',
      'at.diseaseId',
      'r.patientData',
      'r.resultData',
      'r.resultDataHash',
      'c.abbreviation as countryAbbreviation'
    )
}

/**
 * Apply custom-field fragment (top-level keys like patientData, resultData, referringSiteId) onto Result row.
 * Mirrors merge rules in result/updateResult.js for JSON columns.
 */
function buildResultUpdateFromCustomFieldFragment(fragment, existingPatientDataObj, existingResultDataObj) {
  const updates = {}
  for (const fieldName of _.keys(fragment)) {
    const value = fragment[fieldName]
    if (_.isPlainObject(value)) {
      const valueFromDb =
        fieldName === 'patientData' ? existingPatientDataObj : fieldName === 'resultData' ? existingResultDataObj : {}
      updates[fieldName] = JSON.stringify({
        ...valueFromDb,
        ...value,
      })
    } else {
      updates[fieldName] = value
    }
  }
  return updates
}

/**
 * Push FormData.customFieldsData onto the linked Result (patientData / resultData / scalar columns).
 *
 * @param {import('knex').Knex.Transaction} trx
 * @param {{ data: string|object, id?: number }} formDataRow — must include `data` JSON with `customFieldsData`
 * @param {number} resultId
 * @param {{ isAlreadyLinked?: boolean }} [opts]
 * @returns {Promise<{ synced: boolean, reason?: string }>}
 */
async function syncFormDataToResult(trx, { formDataRow, resultId }, opts = {}) {
  const { isAlreadyLinked = false } = opts

  if (!resultId || !formDataRow) {
    return { synced: false, reason: 'missing_args' }
  }

  const parsed = parseFormDataContent(formDataRow.data)
  const { customFieldsData = [] } = parsed
  if (!Array.isArray(customFieldsData) || customFieldsData.length === 0) {
    return { synced: false, reason: 'no_custom_fields_data' }
  }

  const ctx = await loadResultSyncContext(trx, resultId)
  if (!ctx) {
    throw Boom.internal(`syncFormDataToResult: result ${resultId} not found`)
  }

  if (!ctx.assayId) {
    if (isAlreadyLinked) {
      throw Boom.badRequest('Cannot sync custom fields: result has no assay.')
    }
    return { synced: false, reason: 'missing_assay' }
  }

  const countryAbbreviation = ctx.countryAbbreviation || ''
  const fragment = await getCustomFieldsFromTrueConnectFormData(
    customFieldsData,
    countryAbbreviation,
    ctx.partnerId,
    ctx.assayId,
    ctx.diseaseId
  )

  if (_.isEmpty(fragment)) {
    if (isAlreadyLinked) {
      // Linked FormData may carry no mappable keys; do not clear existing Result custom-field columns.
      return { synced: true, reason: 'empty_fragment_skip' }
    }
    return { synced: false, reason: 'empty_fragment' }
  }

  const patientDataObj = safeJsonParse(ctx.patientData, {})
  const resultDataObj = safeJsonParse(ctx.resultData, {})

  const updates = buildResultUpdateFromCustomFieldFragment(fragment, patientDataObj, resultDataObj)

  if (updates.patientData !== undefined || updates.resultData !== undefined) {
    updates.resultDataHash = null
  }

  await trx('Result').where({ id: resultId }).update(updates)

  logger.debug(
    { resultId, formDataId: formDataRow.id, keys: _.keys(updates) },
    { reLabel: 'mobileApi:syncFormDataToResult' }
  )

  return { synced: true }
}

module.exports = {
  syncFormDataToResult,
  loadResultSyncContext,
  parseFormDataContent,
  buildResultUpdateFromCustomFieldFragment,
}
