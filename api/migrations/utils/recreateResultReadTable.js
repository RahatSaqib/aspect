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
    table.string('assay_externalId', 15).notNullable()
    table.string('assay_name', 30).notNullable()
    table.string('assay_i18nKey', 20).notNullable()
    table.integer('assayType_id').unsigned().nullable()
    table.string('assayType_externalId', 20).notNullable()
    table.string('assayType_name', 25).notNullable()
    table.string('assayType_i18nKey', 25).notNullable()
    table.boolean('site_disabled').nullable()
    table.string('deviceMaintenanceStatus_externalId', 50).nullable()
    table.string('deviceApproval_token', 50).nullable()
    table.string('sample_externalId', 32).notNullable()
    table.string('resultSource_name', 25).notNullable()
    table.string('resultSource_externalId', 30).notNullable()
    table.string('resultType_name', 25).notNullable()
    table.string('resultType_externalId', 15).notNullable()
    table.boolean('resultType_excluded').nullable()
    table.string('resultCategory1_name', 25).nullable()
    table.string('resultCategory1_i18nKey', 40).nullable()
    table.string('resultCategory2_name', 25).nullable()
    table.string('resultCategory2_i18nKey', 40).nullable()
    table.string('assay_resultCategory1Label', 25).nullable()
    table.string('assay_resultCategory1Label_i18nKey', 40).nullable()
    table.string('assay_resultCategory2Label', 25).nullable()
    table.string('assay_resultCategory2Label_i18nKey', 40).nullable()
    table.boolean('resultCategoryAssay_requiresTreatment').nullable()
    table.boolean('resultCategoryAssay_reportable').nullable()
    table.integer('disease_Id').unsigned().notNullable()
    table.string('disease_name', 25).notNullable()
    table.string('disease_externalId', 10).notNullable()
    table.string('patient_externalId', 100).nullable() // json extracted
    table.string('copies', 15).nullable() // json extracted
    table.string('resultText', 300).nullable() // json extracted, resultData->>$.resultText (2025 max in prod: 286 chars), fallback to resultCategory1_name | resultCategory2_name
    table.string('notes', 400).nullable()
  })

  // Create the primary key on id for the upsert operations
  await knex.schema.alterTable('Result_read', function (table) {
    table.unique('id')
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

async function createResultReadTriggers(knex) {
  // Drop existing triggers if they exist
  await knex.raw('DROP TRIGGER IF EXISTS `trg_result_read_insert`')
  await knex.raw('DROP TRIGGER IF EXISTS `trg_result_read_update`')

  // Common SQL for both triggers - inserts or updates into Result_read
  const upsertQuery = `
      INSERT INTO Result_read (
        id,
        partnerId,
        assayId,
        siteId,
        deviceId,
        externalId,
        reportableSiteId,
        referringSiteId,
        resultSourceId,
        resultTypeId,
        longitude,
        latitude,
        sampleId,
        resultCategory1,
        resultCategory2,
        resultStatusLogId,
        resultDataHash,
        assayVersion,
        startedOn,
        endedOn,
        consumableSerial,
        consumableExpirationDate,
        consumableLot,
        instrumentSerial,
        moduleName,
        moduleSerial,
        senderVersion,
        senderOperator,
        oemData,
        errorCode,
        createdOn,
        createdBy,
        updatedOn,
        updatedBy,
        reconciliationDate,
        country_id,
        assay_externalId,
        assay_name,
        assay_i18nKey,
        assayType_id,
        assayType_externalId,
        assayType_name,
        assayType_i18nKey,
        site_disabled,
        deviceMaintenanceStatus_externalId,
        deviceApproval_token,
        sample_externalId,
        resultSource_name,
        resultSource_externalId,
        resultType_name,
        resultType_externalId,
        resultType_excluded,
        resultCategory1_name,
        resultCategory1_i18nKey,
        resultCategory2_name,
        resultCategory2_i18nKey,
        assay_resultCategory1Label,
        assay_resultCategory1Label_i18nKey,
        assay_resultCategory2Label,
        assay_resultCategory2Label_i18nKey,
        resultCategoryAssay_requiresTreatment,
        resultCategoryAssay_reportable,
        disease_Id,
        disease_name,
        disease_externalId,
        patient_externalId,
        copies,
        resultText,
        notes
      )
      SELECT
        r.id,
        r.partnerId,
        r.assayId,
        r.siteId,
        r.deviceId,
        LEFT(r.externalId, 100) as externalId,
        r.reportableSiteId,
        r.referringSiteId,
        r.resultSourceId,
        r.resultTypeId,
        r.longitude,
        r.latitude,
        r.sampleId,
        r.resultCategory1,
        r.resultCategory2,
        r.resultStatusLogId,
        LEFT(r.resultDataHash, 32) as resultDataHash,
        LEFT(r.assayVersion, 6) as assayVersion,
        r.startedOn,
        IFNULL(r.endedOn, r.startedOn) as endedOn,
        LEFT(r.consumableSerial, 15) as consumableSerial,
        r.consumableExpirationDate,
        LEFT(r.consumableLot, 15) as consumableLot,
        LEFT(r.instrumentSerial, 25) as instrumentSerial,
        LEFT(r.moduleName, 15) as moduleName,
        LEFT(r.moduleSerial, 15) as moduleSerial,
        LEFT(r.senderVersion, 6) as senderVersion,
        LEFT(r.senderOperator, 50) as senderOperator,
        LEFT(r.oemData, 4) as oemData,
        LEFT(r.errorCode, 4) as errorCode,
        r.createdOn,
        r.createdBy,
        r.updatedOn,
        r.updatedBy,
        r.reconciliationDate,
        g.countryId as country_id,
        LEFT(a.externalId, 15) as assay_externalId,
        LEFT(a.name, 30) as assay_name,
        LEFT(a.i18nKey, 20) as assay_i18nKey,
        at.id as assayType_id,
        LEFT(at.externalId, 20) as assayType_externalId,
        LEFT(at.name, 25) as assayType_name,
        LEFT(at.i18nKey, 25) as assayType_i18nKey,
        si.disabled as site_disabled,
        LEFT(dms.externalId, 50) as deviceMaintenanceStatus_externalId,
        LEFT(da.token, 50) as deviceApproval_token,
        LEFT(sp.externalId, 32) as sample_externalId,
        LEFT(rso.name, 25) as resultSource_name,
        LEFT(rso.externalId, 30) as resultSource_externalId,
        LEFT(rt.name, 25) as resultType_name,
        LEFT(rt.externalId, 15) as resultType_externalId,
        rt.excluded as resultType_excluded,
        LEFT(rc1.name, 25) as resultCategory1_name,
        LEFT(rc1.i18nKey, 40) as resultCategory1_i18nKey,
        LEFT(rc2.name, 25) as resultCategory2_name,
        LEFT(rc2.i18nKey, 40) as resultCategory2_i18nKey,
        LEFT(a.resultCategory1label, 25) as assay_resultCategory1Label,
        LEFT(a.resultCategory1i18nKey, 40) as assay_resultCategory1Label_i18nKey,
        LEFT(a.resultCategory2label, 25) as assay_resultCategory2Label,
        LEFT(a.resultCategory2i18nKey, 40) as assay_resultCategory2Label_i18nKey,
        rca.requiresTreatment as resultCategoryAssay_requiresTreatment,
        rca.reportable as resultCategoryAssay_reportable,
        dis.id as disease_Id,
        LEFT(dis.name, 25) as disease_name,
        LEFT(dis.externalId, 10) as disease_externalId,
        LEFT(JSON_UNQUOTE(JSON_EXTRACT(r.patientData, '$.id')), 100) as patient_externalId,
        LEFT(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, '$.copies')), 15) as copies,
        LEFT(
          IFNULL(
            JSON_UNQUOTE(JSON_EXTRACT(r.resultData, '$.resultText')),
            CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))
          ),
          300
        ) as resultText,
        LEFT(r.notes, 400) as notes
      FROM Result as r
      INNER JOIN Assay as a ON r.assayId = a.id
      INNER JOIN AssayType as at ON a.assayTypeId = at.id
      INNER JOIN Device as d ON r.deviceId = d.id
      INNER JOIN ResultSource as rso ON r.resultSourceId = rso.id
      INNER JOIN ResultType as rt ON r.resultTypeId = rt.id
      LEFT JOIN DeviceType as dt ON d.deviceTypeId = dt.id
      LEFT JOIN Disease as dis ON at.diseaseId = dis.id
      LEFT JOIN Site as si ON r.siteId = si.id
      LEFT JOIN Geography as g ON si.geographyId = g.id
      LEFT JOIN Country as c ON g.countryId = c.id
      LEFT JOIN State as st ON g.stateId = st.id
      LEFT JOIN Lga as lg ON g.lgaId = lg.id
      LEFT JOIN ResultCategory as rc1 ON r.resultCategory1 = rc1.id
      LEFT JOIN ResultCategory as rc2 ON r.resultCategory2 = rc2.id
      LEFT JOIN Sample as sp ON r.sampleId = sp.id
      LEFT JOIN SampleType as stp ON sp.sampleTypeId = stp.id
      LEFT JOIN Site as so ON sp.originSiteId = so.id
      LEFT JOIN ResultCategoryAssay as rca ON r.assayId = rca.assayId AND r.resultCategory1 = rca.resultCategoryId
      LEFT JOIN (
        SELECT dmsl.*,
               ROW_NUMBER() OVER (PARTITION BY deviceId ORDER BY id DESC) as rn
        FROM DeviceMaintenanceStatusLog as dmsl
      ) as dmsl ON d.id = dmsl.deviceId AND dmsl.rn = 1
      LEFT JOIN DeviceMaintenanceStatus as dms ON dmsl.deviceMaintenanceStatusId = dms.id
      LEFT JOIN DeviceApproval as da ON d.deviceApprovalId = da.id
      WHERE r.id = NEW.id
      ON DUPLICATE KEY UPDATE
        partnerId = VALUES(partnerId),
        assayId = VALUES(assayId),
        siteId = VALUES(siteId),
        deviceId = VALUES(deviceId),
        externalId = VALUES(externalId),
        reportableSiteId = VALUES(reportableSiteId),
        referringSiteId = VALUES(referringSiteId),
        resultSourceId = VALUES(resultSourceId),
        resultTypeId = VALUES(resultTypeId),
        longitude = VALUES(longitude),
        latitude = VALUES(latitude),
        sampleId = VALUES(sampleId),
        resultCategory1 = VALUES(resultCategory1),
        resultCategory2 = VALUES(resultCategory2),
        resultStatusLogId = VALUES(resultStatusLogId),
        resultDataHash = VALUES(resultDataHash),
        assayVersion = VALUES(assayVersion),
        startedOn = VALUES(startedOn),
        endedOn = VALUES(endedOn),
        consumableSerial = VALUES(consumableSerial),
        consumableExpirationDate = VALUES(consumableExpirationDate),
        consumableLot = VALUES(consumableLot),
        instrumentSerial = VALUES(instrumentSerial),
        moduleName = VALUES(moduleName),
        moduleSerial = VALUES(moduleSerial),
        senderVersion = VALUES(senderVersion),
        senderOperator = VALUES(senderOperator),
        oemData = VALUES(oemData),
        errorCode = VALUES(errorCode),
        createdOn = VALUES(createdOn),
        createdBy = VALUES(createdBy),
        updatedOn = VALUES(updatedOn),
        updatedBy = VALUES(updatedBy),
        reconciliationDate = VALUES(reconciliationDate),
        country_id = VALUES(country_id),
        assay_externalId = VALUES(assay_externalId),
        assay_name = VALUES(assay_name),
        assay_i18nKey = VALUES(assay_i18nKey),
        assayType_id = VALUES(assayType_id),
        assayType_externalId = VALUES(assayType_externalId),
        assayType_name = VALUES(assayType_name),
        assayType_i18nKey = VALUES(assayType_i18nKey),
        site_disabled = VALUES(site_disabled),
        deviceMaintenanceStatus_externalId = VALUES(deviceMaintenanceStatus_externalId),
        deviceApproval_token = VALUES(deviceApproval_token),
        sample_externalId = VALUES(sample_externalId),
        resultSource_name = VALUES(resultSource_name),
        resultSource_externalId = VALUES(resultSource_externalId),
        resultType_name = VALUES(resultType_name),
        resultType_externalId = VALUES(resultType_externalId),
        resultType_excluded = VALUES(resultType_excluded),
        resultCategory1_name = VALUES(resultCategory1_name),
        resultCategory1_i18nKey = VALUES(resultCategory1_i18nKey),
        resultCategory2_name = VALUES(resultCategory2_name),
        resultCategory2_i18nKey = VALUES(resultCategory2_i18nKey),
        assay_resultCategory1Label = VALUES(assay_resultCategory1Label),
        assay_resultCategory1Label_i18nKey = VALUES(assay_resultCategory1Label_i18nKey),
        assay_resultCategory2Label = VALUES(assay_resultCategory2Label),
        assay_resultCategory2Label_i18nKey = VALUES(assay_resultCategory2Label_i18nKey),
        resultCategoryAssay_requiresTreatment = VALUES(resultCategoryAssay_requiresTreatment),
        resultCategoryAssay_reportable = VALUES(resultCategoryAssay_reportable),
        disease_Id = VALUES(disease_Id),
        disease_name = VALUES(disease_name),
        disease_externalId = VALUES(disease_externalId),
        patient_externalId = VALUES(patient_externalId),
        copies = VALUES(copies),
        resultText = VALUES(resultText),
        notes = VALUES(notes);
    `

  // Create INSERT trigger
  await knex.raw(`
    CREATE TRIGGER trg_result_read_insert
    AFTER INSERT ON Result
    FOR EACH ROW
    BEGIN
    ${upsertQuery}
    END
  `)

  // Create UPDATE trigger
  await knex.raw(`
    CREATE TRIGGER trg_result_read_update
    AFTER UPDATE ON Result
    FOR EACH ROW
    BEGIN
    ${upsertQuery}
    END
  `)
}

async function dropResultReadTriggers(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS `trg_result_read_insert`')
  await knex.raw('DROP TRIGGER IF EXISTS `trg_result_read_update`')
}

module.exports = {
  recreateResultReadTable,
  createResultReadTableIndexes,
  dropResultReadTableIndexes,
  createResultReadTriggers,
  dropResultReadTriggers,
}
