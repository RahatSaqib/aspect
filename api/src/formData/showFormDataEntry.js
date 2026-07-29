const Boom = require('@hapi/boom')
const { getConstraints } = require('../auth/constraints')
const { buildBaseQuery } = require('./db')
const { parseRow, enrichWithFormFields } = require('./formFieldsService')

async function showFormDataEntry({ auth, params }) {
  const dataConstraints = await getConstraints(auth.credentials)
  const partnerId = dataConstraints.partner.id
  const row = await getFormDataEntryById(dataConstraints, params.id)

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

// ── Inline DB query (not shared) ──────────────────────────────────────────────

function getFormDataEntryById(dataConstraints, id) {
  return buildBaseQuery(dataConstraints)
    .where('fd.id', id)
    .first(
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
}

module.exports = { showFormDataEntry }
