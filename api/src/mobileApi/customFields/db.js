const { knex } = require('../../db')
const { addConstraints } = require('../../auth/constraints')

const FORM_DATA_SELECT_COLUMNS = [
  'fd.id',
  'fd.siteId',
  'fd.resultId',
  'fd.sampleExternalId',
  'fd.externalId',
  'fd.data',
  'fd.collectedOn',
]

function applyPartnerFilter(query, partnerId) {
  if (partnerId === null) {
    query.whereNull('s.partnerId')
    return
  }

  query.where('s.partnerId', partnerId)
}

async function getSitePartnerId(trx, siteId) {
  const site = await trx('Site as s').where('s.id', siteId).first('s.partnerId')
  return site ? site.partnerId : null
}

async function lockPartnerSites(trx, partnerId) {
  const query = trx('Site as s').select('s.id').forUpdate()
  applyPartnerFilter(query, partnerId)
  return query
}

async function getFormDataByPartnerExternalId(trx, partnerId, externalId) {
  if (!externalId) {
    return null
  }

  const query = trx('FormData as fd')
    .join('Site as s', 's.id', 'fd.siteId')
    .where('fd.externalId', externalId)
    .forUpdate()

  applyPartnerFilter(query, partnerId)

  return query.first(FORM_DATA_SELECT_COLUMNS)
}

async function getFormDataBySiteAndSample(trx, siteId, sampleExternalId) {
  return trx('FormData as fd')
    .where('fd.siteId', siteId)
    .where('fd.sampleExternalId', sampleExternalId)
    .forUpdate()
    .first(FORM_DATA_SELECT_COLUMNS)
}

async function insertFormData(trx, data) {
  return trx('FormData').insert(data)
}

async function updateFormData(trx, id, data) {
  return trx('FormData').where('id', id).update(data)
}

async function getAccessibleFormDataByExternalId(externalId, dataConstraints) {
  return knex('FormData as fd')
    .join('Site as s', 's.id', 'fd.siteId')
    .modify(addConstraints, dataConstraints, { site: 's' })
    .where('fd.externalId', externalId)
    .first(FORM_DATA_SELECT_COLUMNS)
}

module.exports = {
  FORM_DATA_SELECT_COLUMNS,
  getSitePartnerId,
  lockPartnerSites,
  getFormDataByPartnerExternalId,
  getFormDataBySiteAndSample,
  insertFormData,
  updateFormData,
  getAccessibleFormDataByExternalId,
}
