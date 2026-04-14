const logger = require('../../shared/logger')
const { normalizeOptionalString } = require('./normalizeSampleExternalId')
const { syncFormDataToResult } = require('./syncFormDataToResult')

async function onFormDataResultLogged(action, { messageContext }) {
  const { resultId } = action
  // messageContext.run uses db.run (no outer transaction); isolate writes in runKnex.transaction.
  return messageContext.run(async runKnex => {
    const siteSample = await loadSiteAndSampleExternalIdForResult(runKnex, resultId)
    if (!siteSample) {
      return
    }
    const { siteId, sampleExternalId } = siteSample

    await runKnex.transaction(async trx => {
      const formRow = await trx('FormData')
        .where({ siteId, sampleExternalId })
        .whereNull('resultId')
        .forUpdate()
        .first('id', 'data', 'siteId', 'sampleExternalId', 'externalId', 'resultId')

      if (!formRow) {
        return
      }

      const { synced, reason } = await syncFormDataToResult(
        trx,
        { formDataRow: formRow, resultId },
        { isAlreadyLinked: false }
      )

      if (!synced) {
        logger.warn({ resultId, siteId, sampleExternalId, reason }, { reLabel: 'mobileApi:linkFormDataOnResultLogged' })
        return
      }

      await trx('FormData').where({ id: formRow.id }).update({ resultId })
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
