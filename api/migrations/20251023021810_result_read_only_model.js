const { addCreateFieldsNullable } = require('./utils')

exports.up = async function (knex) {
  await knex.raw('DROP TABLE IF EXISTS Result_read')
  await knex.schema.createTable('Result_read', function (table) {
    // PatientCase skipped, not in use
    // TreatmentStatus skipped, not in use
    // SampleRunNumber skipped, not in use
    // SampleGroup skipped, not in use
    table.increments('id').unsigned()
    table.integer('partnerId').unsigned().notNullable() // join
    table.integer('assayId').unsigned().notNullable() // join
    table.integer('siteId').unsigned().nullable() // join
    table.integer('deviceId').unsigned().notNullable() // join
    table.string('externalId', 100).notNullable()
    table.integer('reportableSiteId').unsigned().notNullable()
    table.integer('referringSiteId').unsigned().nullable()
    table.integer('resultSourceId').unsigned().notNullable() // denormalized
    table.integer('resultTypeId').unsigned().notNullable() // denormalized
    table.float('longitude', 10, 6).nullable()
    table.float('latitude', 10, 6).nullable()
    table.integer('sampleId').unsigned().notNullable() // join
    table.integer('resultCategory1').unsigned().nullable()
    table.integer('resultCategory2').unsigned().nullable()
    table.integer('resultStatusLogId').unsigned().nullable()
    table.string('resultDataHash', 32).nullable()
    table.string('assayVersion', 6).nullable()
    table.dateTime('startedOn').nullable()
    table.dateTime('endedOn').nullable()
    table.string('consumableSerial', 15).nullable()
    table.dateTime('consumableExpirationDate').nullable()
    table.string('consumableLot', 15).nullable()
    table.string('instrumentSerial', 25).nullable()
    table.string('moduleName', 15).nullable()
    table.string('moduleSerial', 15).nullable()
    table.string('senderVersion', 6).nullable()
    table.string('senderOperator', 50).nullable()
    table.string('oemData', 4).nullable()
    table.string('errorCode', 4).nullable()
    table.dateTime('createdOn').notNullable()
    table.integer('createdBy').unsigned().nullable()
    table.dateTime('updatedOn').notNullable()
    table.integer('updatedBy').unsigned().nullable()
    table.dateTime('reconciliationDate').nullable()
    // Additional fields
    table.integer('country_id').unsigned().nullable()
    table.string('assay_name', 30).notNullable()
    table.string('assay_i18nKey', 20).notNullable()
    table.string('assay_externalId', 15).notNullable()
    table.boolean('site_disabled').nullable()
    table.string('deviceMaintenanceStatus_externalId', 50).nullable()
    table.string('deviceApproval_token', 50).nullable()
    table.string('sample_externalId', 32).nullable()
    table.string('resultSource_name', 25).notNullable()
    table.string('resultSource_externalId', 30).notNullable()
    table.string('resultType_name', 25).notNullable()
    table.string('resultType_externalId', 15).notNullable()
    table.boolean('resultType_excluded').notNullable()
    table.string('resultCategory1_name', 25).nullable()
    table.string('resultCategory1_i18nKey', 40).nullable()
    table.string('resultCategory2_name', 25).nullable()
    table.string('resultCategory2_i18nKey', 40).nullable()
    table.string('assay_resultCategory1Label', 25).nullable()
    table.string('assay_resultCategory1Label_i18nKey', 40).nullable()
    table.string('assay_resultCategory2Label', 25).nullable()
    table.string('assay_resultCategory2Label_i18nKey', 40).nullable()
    table.boolean('resultCategoryAssay_requiresTreatment').nullable()
    table.string('disease_name', 25).nullable()
    table.string('disease_externalId', 10).nullable()
    table.string('patient_externalId', 100).nullable() // extracted
    table.string('copies', 15).nullable() // calculated
    table.string('resultText', 300).nullable() // extracted, resultData->>$.resultText (2025 max in prod: 286 chars)
    table.string('notes', 400).nullable()

    // Foreign key indexes for joins
    table.index('partnerId', 'idx_result_read_partnerId')
    table.index('assayId', 'idx_result_read_assayId')
    table.index('siteId', 'idx_result_read_siteId')
    table.index('deviceId', 'idx_result_read_deviceId')
    table.index('sampleId', 'idx_result_read_sampleId')
    table.index('reportableSiteId', 'idx_result_read_reportableSiteId')
    table.index('referringSiteId', 'idx_result_read_referringSiteId')
    table.index('resultSourceId', 'idx_result_read_resultSourceId')
    table.index('resultTypeId', 'idx_result_read_resultTypeId')
    table.index('resultStatusLogId', 'idx_result_read_resultStatusLogId')

    // Id index
    table.index('id', 'idx_result_read_id')
    // Date range filtering indexes
    table.index('endedOn', 'idx_result_read_endedOn')
    table.index('startedOn', 'idx_result_read_startedOn')
    table.index('updatedOn', 'idx_result_read_updatedOn')
    table.index('createdOn', 'idx_result_read_createdOn')

    // Category filtering indexes
    table.index('resultCategory1', 'idx_result_read_resultCategory1')
    table.index('resultCategory2', 'idx_result_read_resultCategory2')

    table.index(['assayId', 'resultCategory1'], 'idx_result_read_assayId_resultCategory1') // ResultCategoryAssay joins in getBaseQueryForResults
    table.index(['assayId', 'resultCategory2'], 'idx_result_read_assayId_resultCategory2') // ResultCategoryAssay joins in getBaseQueryForResults

    // Text search indexes
    table.index('errorCode', 'idx_result_read_errorCode')
    table.index('externalId', 'idx_result_read_externalId')

    // Null check index
    table.index('reconciliationDate', 'idx_result_read_reconciliationDate')

    // Additional denormalized field indexes
    table.index('country_id', 'idx_result_read_country_id')
    table.index('assay_externalId', 'idx_result_read_assay_externalId')
    table.index('sample_externalId', 'idx_result_read_sample_externalId')
  })
  // Composite indexes for common query patterns (with DESC on endedOn to match ORDER BY endedOn DESC)
  await knex.schema.raw('CREATE INDEX idx_result_read_assayId_endedOn_desc ON ?? (??, ?? DESC)', [
    'Result_read',
    'assayId',
    'endedOn',
  ]) // getQueryForResultsListAndExport, getClinicalIndicatorQueryForResultsTable
  await knex.schema.raw('CREATE INDEX idx_result_read_siteId_endedOn_desc ON ?? (??, ?? DESC)', [
    'Result_read',
    'siteId',
    'endedOn',
  ]) // getQueryForResultsListAndExport, getQueryForDataExtract, confirmedTreatmentTracking
  await knex.schema.raw('CREATE INDEX idx_result_read_deviceId_endedOn_desc ON ?? (??, ?? DESC)', [
    'Result_read',
    'deviceId',
    'endedOn',
  ]) // getQueryForResultsListAndExport, getQueryForDataExtract, getDeviceErrorHistoryForAttachment
  await knex.schema.raw('CREATE INDEX idx_result_read_partnerId_endedOn_desc ON ?? (??, ?? DESC)', [
    'Result_read',
    'partnerId',
    'endedOn',
  ]) // getQueryForResultsListAndExport, getAllResultsReport (mentions partner_endedOn_index)
  await knex.schema.raw('CREATE INDEX idx_result_read_reportableSiteId_endedOn_desc ON ?? (??, ?? DESC)', [
    'Result_read',
    'reportableSiteId',
    'endedOn',
  ]) // getQueryForResultsListAndExport, transferResult queries
  await knex.schema.raw('CREATE INDEX idx_result_read_resultCategory1_endedOn_desc ON ?? (??, ?? DESC)', [
    'Result_read',
    'resultCategory1',
    'endedOn',
  ]) // getQueryForResultsListAndExport, getClinicalIndicatorQueryForResultsTable, confirmedTreatmentTracking
  await knex.schema.raw('CREATE INDEX idx_result_read_resultCategory2_endedOn_desc ON ?? (??, ?? DESC)', [
    'Result_read',
    'resultCategory2',
    'endedOn',
  ]) // getQueryForResultsListAndExport, getClinicalIndicatorQueryForResultsTable
}

// order by r.id;
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('Result_read')
}
