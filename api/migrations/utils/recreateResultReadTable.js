async function recreateResultReadTable(knex) {
  await knex.raw('DROP TABLE IF EXISTS Result_read')
  await knex.schema.createTable('Result_read', function (table) {
    // PatientCase skipped, not in use
    // TreatmentStatus skipped, not in use
    // SampleRunNumber skipped, not in use
    // SampleGroup skipped, not in use
    table.increments('id').primary()
    table.integer('partnerId').unsigned().notNullable() // use join
    table.integer('assayId').unsigned().notNullable() // use join
    table.integer('siteId').unsigned().nullable() // use join
    table.integer('deviceId').unsigned().notNullable() // usejoin
    table.string('externalId', 100).notNullable()
    table.integer('reportableSiteId').unsigned().notNullable()
    table.integer('referringSiteId').unsigned().nullable()
    table.integer('resultSourceId').unsigned().notNullable() // denormalized
    table.integer('resultTypeId').unsigned().notNullable() // denormalized
    table.float('longitude', 10, 6).nullable()
    table.float('latitude', 10, 6).nullable()
    table.integer('sampleId').unsigned().notNullable() // use join
    table.integer('resultCategory1').unsigned().nullable() // denormalized
    table.integer('resultCategory2').unsigned().nullable() // denormalized
    table.integer('resultStatusLogId').unsigned().nullable() // use join
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
    // Related fields
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
    table.integer('disease_Id').unsigned().nullable()
    table.string('disease_name', 25).nullable()
    table.string('disease_externalId', 10).nullable()
    table.string('patient_externalId', 100).nullable() // json extracted
    table.string('copies', 15).nullable() // json extracted
    table.string('resultText', 300).nullable() // json extracted, resultData->>$.resultText (2025 max in prod: 286 chars), fallback to resultCategory1_name | resultCategory2_name
    table.string('notes', 400).nullable()
  })
}

async function createResultReadTableIndexes(knex) {
  await knex.schema.table('Result_read', function (table) {
    table.index('partnerId', 'idx_result_read_partnerId')
    table.index(['partnerId', 'reconciliationDate'], 'idx_result_read_partnerId_reconciliationDate')
    table.index(['partnerId', 'sample_externalId'], 'idx_result_read_partnerId_sample_externalId')
  })

  // Composite indexes for common query patterns
  await knex.schema.raw(
    'CREATE INDEX idx_result_read_partnerId_assayId_endedOn_desc ON Result_read (partnerId, assayId, endedOn DESC)'
  ) // getQueryForResultsListAndExport, getClinicalIndicatorQueryForResultsTable

  await knex.schema.raw(
    'CREATE INDEX idx_result_read_partnerId_siteId_endedOn_desc ON Result_read (partnerId, siteId, endedOn DESC)'
  ) // getQueryForResultsListAndExport, getQueryForDataExtract, confirmedTreatmentTracking

  await knex.schema.raw(
    'CREATE INDEX idx_result_read_partnerId_deviceId_endedOn_desc ON Result_read (partnerId, deviceId, endedOn DESC)'
  ) // getQueryForResultsListAndExport, getQueryForDataExtract, getDeviceErrorHistoryForAttachment

  await knex.schema.raw(
    'CREATE INDEX idx_result_read_partnerId_reportableSiteId_endedOn_desc ON Result_read (partnerId, reportableSiteId, endedOn DESC)'
  ) // getQueryForResultsListAndExport, transferResult queries

  await knex.schema.raw(
    'CREATE INDEX idx_result_read_partnerId_resultCategory1_endedOn_desc ON Result_read (partnerId, resultCategory1, endedOn DESC)'
  ) // getQueryForResultsListAndExport, getClinicalIndicatorQueryForResultsTable, confirmedTreatmentTracking

  await knex.schema.raw(
    'CREATE INDEX idx_result_read_partnerId_assayId_resultCategory1_endedOn_desc ON Result_read (partnerId, assayId, resultCategory1, endedOn DESC)'
  ) // Common query pattern with category filtering

  await knex.schema.raw(
    'CREATE INDEX idx_result_read_partnerId_externalId_endedOn_desc ON Result_read (partnerId, externalId, endedOn DESC)'
  ) // ExternalId lookups with ordering
}

async function dropResultReadTableIndexes(knex) {
  const indexNames = [
    'idx_result_read_partnerId',
    'idx_result_read_partnerId_reconciliationDate',
    'idx_result_read_partnerId_sample_externalId',
    'idx_result_read_partnerId_assayId_endedOn_desc',
    'idx_result_read_partnerId_siteId_endedOn_desc',
    'idx_result_read_partnerId_deviceId_endedOn_desc',
    'idx_result_read_partnerId_reportableSiteId_endedOn_desc',
    'idx_result_read_partnerId_resultCategory1_endedOn_desc',
    'idx_result_read_partnerId_assayId_resultCategory1_endedOn_desc',
    'idx_result_read_partnerId_externalId_endedOn_desc',
  ]

  for (const indexName of indexNames) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await knex.schema.raw(`DROP INDEX ${indexName} ON Result_read`)
    } catch (err) {
      // Index doesn't exist, ignore error
    }
  }
}

module.exports = { recreateResultReadTable, createResultReadTableIndexes, dropResultReadTableIndexes }
