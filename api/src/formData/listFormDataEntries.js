const { sortPageParams } = require('../db')
const { getConstraints } = require('../auth/constraints')
const { buildBaseQuery } = require('./db')
const { parseRow, enrichWithFormFields } = require('./formFieldsService')

/**
 * Maps the API sort keys (the web table column keys, whitelisted in endpoints.js via
 * validateSortPageParams) onto their aliased DB columns. `createdOn` is the default sort.
 */
const SORT_COLUMNS = {
  sampleExternalId: 'fd.sampleExternalId',
  siteName: 's.name',
  collectedOn: 'fd.collectedOn',
  resultEndedOn: 'r.endedOn',
  createdOn: 'fd.createdOn',
}

async function listFormDataEntries({ auth, query }) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { siteId, minDate, maxDate, sampleExternalId, matched } = query
  const partnerId = dataConstraints.partner.id

  /**
   * Same shape as result list (ISO with offset). Joi guarantees both are present.
   */
  const filters = {
    siteId,
    minDate: coerceQueryDate(minDate),
    maxDate: coerceQueryDate(maxDate),
    sampleExternalId,
    matched: parseMatchedFilter(matched),
  }

  const [rows, totalRow] = await Promise.all([
    getFormDataEntries(dataConstraints, filters, query),
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

// ── Query param parsing ───────────────────────────────────────────────────────

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

function coerceQueryDate(value) {
  return value instanceof Date ? value : new Date(value)
}

// ── Inline DB queries (not shared) ────────────────────────────────────────────

function applyListFilters(query, { siteId, minDate, maxDate, sampleExternalId, matched }) {
  if (siteId) {
    query.where('fd.siteId', siteId)
  }

  // minDate / maxDate: UTC instants from the client (required on GET /form-data)
  if (minDate) {
    query.where('fd.createdOn', '>=', minDate)
  }

  if (maxDate) {
    query.where('fd.createdOn', '<=', maxDate)
  }

  if (sampleExternalId) {
    query.where('fd.sampleExternalId', 'like', `%${sampleExternalId}%`)
  }

  if (matched === true) {
    query.whereNotNull('fd.resultId')
  }

  if (matched === false) {
    query.whereNull('fd.resultId')
  }
}

function getFormDataEntries(dataConstraints, filters, sortPageQuery) {
  return buildBaseQuery(dataConstraints)
    .modify(applyListFilters, filters)
    .select(
      'fd.id',
      'fd.siteId',
      's.partnerId',
      's.name as siteName',
      'fd.resultId',
      'r.endedOn as resultEndedOn',
      'fd.sampleExternalId',
      'fd.externalId',
      'fd.collectedOn',
      'fd.createdOn',
      'fd.updatedOn',
      'fd.data'
    )
    .modify(sortPageParams, sortPageQuery, 'createdOn', SORT_COLUMNS)
}

function countFormDataEntries(dataConstraints, filters) {
  return buildBaseQuery(dataConstraints).modify(applyListFilters, filters).countDistinct('fd.id as total').first()
}

module.exports = { listFormDataEntries }
