const { knex, pageParams } = require('../db')
const { addConstraints } = require('../auth/constraints')

function buildBaseQuery(dataConstraints) {
  return knex('FormData as fd')
    .join('Site as s', 's.id', 'fd.siteId')
    .leftJoin('Result as r', 'r.id', 'fd.resultId')
    .modify(addConstraints, dataConstraints, { site: 's' })
}

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

function getFormDataEntries(dataConstraints, filters, paging) {
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
    .orderBy('fd.createdOn', 'desc')
    .modify(pageParams, paging)
}

function countFormDataEntries(dataConstraints, filters) {
  return buildBaseQuery(dataConstraints).modify(applyListFilters, filters).countDistinct('fd.id as total').first()
}

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

module.exports = { getFormDataEntries, countFormDataEntries, getFormDataEntryById }
