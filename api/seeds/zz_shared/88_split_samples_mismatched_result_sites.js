/**
 * ASP-7978 backfill: samples shared across results where `Sample.originSiteId` does not match at least
 * one `Result.siteId` (non–mobile samples). For each such sample, keep the first result (by `Result.id`)
 * on the existing row; create a new `Sample` per remaining result with `originSiteId = Result.siteId`
 * and repoint `Result.sampleId`.
 *
 * One-time seed; tracked in `AspectSeed`. Runs in shared seed environments only (not develop/test).
 */
const omit = require('lodash/omit')
const logger = require('../../src/shared/logger')

module.exports = require('../utils').seed(seed, __filename)

const BATCH_SIZE = 250

function nullSafeSitesDiffer(sampleOriginSiteId, resultSiteId) {
  if (sampleOriginSiteId == null && resultSiteId == null) {
    return false
  }
  if (sampleOriginSiteId == null || resultSiteId == null) {
    return true
  }
  return sampleOriginSiteId !== resultSiteId
}

function buildSampleClone(sample, originSiteId, now) {
  return {
    ...omit(sample, ['id', 'createdOn', 'updatedOn', 'createdBy', 'updatedBy']),
    originSiteId,
    registeredInMobile: false,
    createdOn: now,
    updatedOn: now,
  }
}

/**
 * @returns {number} number of results repointed
 */
async function processOneSample(trx, sampleId) {
  const sample = await trx('Sample').where({ id: sampleId }).first()
  if (!sample || sample.registeredInMobile) {
    return 0
  }

  const results = await trx('Result').where({ sampleId }).orderBy('id', 'asc').select('id', 'siteId')

  if (results.length <= 1) {
    return 0
  }

  const hasMismatch = results.some(r => nullSafeSitesDiffer(sample.originSiteId, r.siteId))
  if (!hasMismatch) {
    return 0
  }

  const now = new Date()
  let repointed = 0
  const [, ...rest] = results

  /* eslint-disable no-await-in-loop -- each insert/update must complete before the next */
  for (const r of rest) {
    const insertPayload = buildSampleClone(sample, r.siteId, now)
    const [newSampleId] = await trx('Sample').insert(insertPayload)
    await trx('Result').where({ id: r.id }).update({ sampleId: newSampleId })
    repointed += 1
  }
  /* eslint-enable no-await-in-loop */

  return repointed
}

async function seed(knex) {
  let lastId = 0
  let samplesTouched = 0
  let resultsRepointed = 0
  let hasMore = true

  /* eslint-disable no-await-in-loop -- paginated scan and one transaction per sample */
  while (hasMore) {
    const rows = await knex('Sample as s')
      .select('s.id')
      .where('s.registeredInMobile', 0)
      .whereRaw('(SELECT COUNT(*) FROM Result r WHERE r.sampleId = s.id) > 1')
      .whereExists(function () {
        this.select(1)
          .from('Result as r2')
          .whereRaw('r2.sampleId = s.id')
          .whereRaw('NOT (s.originSiteId <=> r2.siteId)')
      })
      .andWhere('s.id', '>', lastId)
      .orderBy('s.id', 'asc')
      .limit(BATCH_SIZE)

    const batchIds = rows.map(r => r.id)
    if (batchIds.length === 0) {
      hasMore = false
      break
    }

    for (const sampleId of batchIds) {
      const n = await knex.transaction(trx => processOneSample(trx, sampleId))
      if (n > 0) {
        samplesTouched += 1
        resultsRepointed += n
      }
    }

    lastId = batchIds[batchIds.length - 1]
    logger.info(
      `88_split_samples_mismatched_result_sites: cursor=${lastId} samplesTouched=${samplesTouched} resultsRepointed=${resultsRepointed}`
    )
  }
  /* eslint-enable no-await-in-loop */

  logger.info(
    `88_split_samples_mismatched_result_sites: done samplesTouched=${samplesTouched} resultsRepointed=${resultsRepointed}`
  )
}
