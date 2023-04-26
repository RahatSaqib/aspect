module.exports = require('../src/db').migration(up)

/**
 * SamplesRegistered status enums:
 * [
 *  "SAMPLE_REGISTERED",
 *  "SAMPLE_READY_FOR_PICKUP",
 *  "SAMPLE_IN_TRANSIT",
 *  "SAMPLE_RECEIVED_AT_LAB",
 *  "SAMPLE_UNDER_ANALYSIS",
 *  "SAMPLE_ANALYSIS_COMPLETED",
 *  "RESULT_PENDING_REVIEW",
 *  "RESULT_REVIEWED",
 *  "RESULT_SENT_TO_PROVIDER",
 *  "RESULT_RECEIVED_BY_PROVIDER",
 *  "RESULT_SHARED_WITH_PATIENT",
 *  "SAMPLE_LOST_IN_TRANSIT",
 *  "SAMPLE_DAMAGED_IN_TRANSIT",
 *  "SAMPLE_DAMAGED_AT_LAB",
 *  "SAMPLE_LOST_AT_LAB",
 *  "SAMPLE_NOT_FEASIBLE_FOR_ANALYSIS"
 * ]
 */

async function up(knex) {
  await knex.schema.alterTable('Sample', row => {
    row.specificType('sampleExtraData', 'JSON')
    row.string('sampleStatus')
    row.dateTime('updatedOn')
  })
}
