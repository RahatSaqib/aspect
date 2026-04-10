const { normalizeOptionalString } = require('./normalizeSampleExternalId')

async function onFormDataResultLogged(action, { messageContext }) {
  const { resultId } = action
  return messageContext.run(async knex => {
    const siteSample = await loadSiteAndSampleExternalIdForResult(knex, resultId)
    if (!siteSample) {
      return
    }
    const { siteId, sampleExternalId } = siteSample
    await assignFormDataResultIdForSiteAndSampleIfUnset(knex, {
      siteId,
      sampleExternalId,
      resultId,
    })
  })
}

async function loadSiteAndSampleExternalIdForResult(trx, resultId) {
  const row = await trx('Result as r')
    .join('Sample as s', 's.id', 'r.sampleId')
    .where('r.id', resultId)
    .first('r.siteId', 's.externalId as sampleExternalId')

  if (!row || row.siteId == null) {
    return null
  }

  const normalizedSampleId = normalizeOptionalString(row.sampleExternalId)
  if (normalizedSampleId == null) {
    return null
  }

  return { siteId: row.siteId, sampleExternalId: normalizedSampleId }
}

async function assignFormDataResultIdForSiteAndSampleIfUnset(trx, { siteId, sampleExternalId, resultId }) {
  if (!siteId || sampleExternalId == null || !resultId) {
    return 0
  }

  return trx('FormData').where({ siteId, sampleExternalId }).whereNull('resultId').update({ resultId })
}

module.exports = {
  onFormDataResultLogged,
  loadSiteAndSampleExternalIdForResult,
  assignFormDataResultIdForSiteAndSampleIfUnset,
}
