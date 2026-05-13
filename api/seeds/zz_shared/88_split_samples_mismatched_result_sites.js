/**
 * ASP-7978 backfill: samples shared across results where `Sample.originSiteId` does not match at least
 * one `Result.siteId` (non–mobile samples). For each such sample, keep the first result (by `Result.id`)
 * on the existing row; create a new `Sample` per remaining result with `originSiteId = Result.siteId`
 * and repoint `Result.sampleId`. New samples use `createdOn` / `updatedOn` from the matching `Result`
 * (falling back to `startedOn` / `endedOn` when needed). Retained samples are then aligned to the first
 * result still on that row: `originSiteId` and audit timestamps are set from that result (correcting
 * the old bug that had overwritten `originSiteId` with the last result's site).
 *
 * Set-based implementation per batch: job temp (includes per-row timestamps from `Result`) →
 * INSERT Sample SELECT (no `Result` join) → bulk UPDATE Result → first-result temp → UPDATE retained `Sample`.
 * Each batch runs in its own transaction (shorter locks than one mega-transaction).
 *
 * One-time seed; tracked in `AspectSeed`. Runs in shared seed environments only (not develop/test).
 *
 * Relies on MySQL behaviour: for a single multi-row INSERT into `Sample`, `insertId` is the first
 * auto-increment value and new ids are consecutive in the same order as `ORDER BY j.seq` (no other
 * inserts on this connection in between).
 */
const logger = require('../../src/shared/logger')

module.exports = require('../utils').seed(seed, __filename)

const BATCH_SIZE = 8000

async function seed(knex) {
  let totalJobs = 0
  let batches = 0

  let more = true
  while (more) {
    let jobCount = 0
    /* eslint-disable no-await-in-loop -- one transaction per batch */
    await knex.transaction(async trx => {
      await trx.raw('DROP TEMPORARY TABLE IF EXISTS _asp7978_split_job')
      await trx.raw(`
        CREATE TEMPORARY TABLE _asp7978_split_job (
          seq INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
          resultId INT UNSIGNED NOT NULL,
          oldSampleId INT UNSIGNED NOT NULL,
          targetSiteId INT UNSIGNED NULL,
          newSampleId INT UNSIGNED NULL,
          newSampleCreatedOn DATETIME NULL,
          newSampleUpdatedOn DATETIME NULL,
          UNIQUE KEY uq_asp7978_resultId (resultId)
        )
      `)

      const insertJobRes = await trx.raw(
        `
        INSERT INTO _asp7978_split_job (
          resultId,
          oldSampleId,
          targetSiteId,
          newSampleCreatedOn,
          newSampleUpdatedOn
        )
        SELECT
          r.id,
          r.sampleId,
          r.siteId,
          COALESCE(r.createdOn, r.startedOn, r.endedOn),
          COALESCE(r.updatedOn, r.createdOn, r.endedOn)
        FROM Result r
        INNER JOIN Sample s ON s.id = r.sampleId AND ifnull(s.registeredInMobile, 0) = 0
        WHERE (SELECT COUNT(*) FROM Result rc WHERE rc.sampleId = s.id) > 1
          AND EXISTS (
            SELECT 1 FROM Result rm
            WHERE rm.sampleId = s.id AND NOT (s.originSiteId <=> rm.siteId)
          )
          AND r.id > (SELECT MIN(r2.id) FROM Result r2 WHERE r2.sampleId = r.sampleId)
        ORDER BY r.id
        LIMIT ${Number(BATCH_SIZE)}
      `
      )

      const insertJobPacket = insertJobRes[0]
      jobCount = insertJobPacket.affectedRows || 0
      if (jobCount === 0) {
        await trx.raw('DROP TEMPORARY TABLE IF EXISTS _asp7978_split_job')
        return
      }

      await trx.raw('DROP TEMPORARY TABLE IF EXISTS _asp7978_first_sample')
      await trx.raw(`
        CREATE TEMPORARY TABLE _asp7978_first_sample (
          oldSampleId INT UNSIGNED NOT NULL PRIMARY KEY,
          originSiteId INT UNSIGNED NULL,
          retainedCreatedOn DATETIME NULL,
          retainedUpdatedOn DATETIME NULL
        )
      `)
      await trx.raw(`
        INSERT INTO _asp7978_first_sample (oldSampleId, originSiteId, retainedCreatedOn, retainedUpdatedOn)
        SELECT
          s.id,
          r.siteId,
          COALESCE(r.createdOn, r.startedOn, r.endedOn),
          COALESCE(r.updatedOn, r.createdOn, r.endedOn)
        FROM (SELECT DISTINCT oldSampleId FROM _asp7978_split_job) d
        INNER JOIN Sample s ON s.id = d.oldSampleId
        INNER JOIN Result r ON r.sampleId = s.id
        WHERE r.id = (SELECT MIN(r2.id) FROM Result r2 WHERE r2.sampleId = s.id)
      `)

      const insertSampleRes = await trx.raw(`
        INSERT INTO Sample (
          externalId,
          collectedOn,
          sampleTypeId,
          originSiteId,
          registeredInMobile,
          sampleData,
          sampleStatus,
          patientId,
          collectedBy,
          updatedBy,
          createdOn,
          updatedOn
        )
        SELECT
          s.externalId,
          s.collectedOn,
          s.sampleTypeId,
          j.targetSiteId,
          0,
          s.sampleData,
          s.sampleStatus,
          s.patientId,
          s.collectedBy,
          s.updatedBy,
          j.newSampleCreatedOn,
          j.newSampleUpdatedOn
        FROM _asp7978_split_job j
        INNER JOIN Sample s ON s.id = j.oldSampleId
        ORDER BY j.seq
      `)

      const insertSamplePacket = insertSampleRes[0]
      const firstNewId = insertSamplePacket.insertId
      const insertedSamples = insertSamplePacket.affectedRows || 0
      if (insertedSamples !== jobCount) {
        throw new Error(
          `ASP-7978 seed: job rows (${jobCount}) != inserted Sample rows (${insertedSamples}); aborting batch`
        )
      }

      await trx.raw('UPDATE _asp7978_split_job j SET j.newSampleId = ? + j.seq - 1', [firstNewId])

      await trx.raw(`
        UPDATE Result r
        INNER JOIN _asp7978_split_job j ON j.resultId = r.id
        SET r.sampleId = j.newSampleId
      `)

      await trx.raw(`
        UPDATE Sample s
        INNER JOIN _asp7978_first_sample f ON f.oldSampleId = s.id
        SET
          s.originSiteId = f.originSiteId,
          s.createdOn = f.retainedCreatedOn,
          s.updatedOn = f.retainedUpdatedOn
      `)

      await trx.raw('DROP TEMPORARY TABLE IF EXISTS _asp7978_first_sample')
      await trx.raw('DROP TEMPORARY TABLE IF EXISTS _asp7978_split_job')
    })
    /* eslint-enable no-await-in-loop */

    if (jobCount === 0) {
      more = false
    } else {
      batches += 1
      totalJobs += jobCount
      logger.info(`88_split_samples_mismatched_result_sites: batch=${batches} rows=${jobCount} cumulative=${totalJobs}`)
    }
  }

  logger.info(`88_split_samples_mismatched_result_sites: done batches=${batches} resultsRepointed=${totalJobs}`)
}
