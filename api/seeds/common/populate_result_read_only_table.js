const {
  recreateResultReadTable,
  createResultReadTableIndexes,
  dropResultReadTableIndexes,
  dropResultReadTriggers,
  createResultReadTriggers,
} = require('../../migrations/utils/recreateResultReadTable')

async function populateResultReadOnlyTable(knex) {
  const start = new Date()
  // eslint-disable-next-line no-console
  console.log(`\x1b[33mDeleting Triggers on Result_READ table....`)
  await dropResultReadTriggers(knex)

  // eslint-disable-next-line no-console
  console.log(`\x1b[33mDeleting Indexes on Result_READ table....`)
  await dropResultReadTableIndexes(knex)

  // eslint-disable-next-line no-console
  console.log(`\x1b[33mDeleting  Result_READ table....`)
  await recreateResultReadTable(knex)

  const latestDeviceMaintenanceStatus = knex('DeviceMaintenanceStatusLog as dmsl')
    .select('dmsl.*')
    .select(knex.raw('ROW_NUMBER() OVER (PARTITION BY deviceId ORDER BY id DESC) as rn'))
    .as('dmsl')

  const BATCH_SIZE = 100000

  // Get max ID
  const { id: maxResultId } = await knex('Result').max('id as id').first()

  const maxId = parseInt(maxResultId, 10)

  const batches = Math.ceil(maxId / BATCH_SIZE)

  // eslint-disable-next-line no-console
  console.log(`\x1b[33mProcessing records with id 1-${maxId} in ${batches} batches\x1b[0m`)

  for (let i = 0; i < batches; i++) {
    const startId = i * BATCH_SIZE + 1
    const endId = (i + 1) * BATCH_SIZE
    const batchStart = new Date()
    // eslint-disable-next-line no-await-in-loop
    await knex('Result_READ').insert(function () {
      return this.from('Result as r')
        .innerJoin('Assay as a', 'r.assayId', 'a.id')
        .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
        .innerJoin('Device as d', 'r.deviceId', 'd.id')
        .innerJoin('ResultSource as rso', 'r.resultSourceId', 'rso.id')
        .innerJoin('ResultType as rt', 'r.resultTypeId', 'rt.id')
        .leftJoin('DeviceType as dt', 'd.deviceTypeId', 'dt.id')
        .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
        .leftJoin('Site as si', 'r.siteId', 'si.id')
        .leftJoin('Geography as g', 'si.geographyId', 'g.id')
        .leftJoin('Country as c', 'g.countryId', 'c.id')
        .leftJoin('State as st', 'g.stateId', 'st.id')
        .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
        .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
        .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
        .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
        .leftJoin('SampleType as stp', 'sp.sampleTypeId', 'stp.id')
        .leftJoin('Site as so', 'sp.originSiteId', 'so.id')
        .leftJoin('ResultCategoryAssay as rca1', function () {
          this.on('r.assayId', 'rca1.assayId').andOn('r.resultCategory1', 'rca1.resultCategoryId')
        })
        .leftJoin('ResultCategoryAssay as rca2', function () {
          this.on('r.assayId', 'rca2.assayId').andOn('r.resultCategory2', 'rca2.resultCategoryId')
        })
        .leftJoin(latestDeviceMaintenanceStatus, function () {
          this.on('d.id', 'dmsl.deviceId').andOn('dmsl.rn', knex.raw('1'))
        })
        .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
        .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
        .leftJoin('ResultCategoryGroup as rcg', join => {
          join.on('r.resultCategory1', 'rcg.resultCategory1Id')
          join.andOn(knex.raw('r.resultCategory2 <=> rcg.resultCategory2Id'))
          join.andOn('r.assayId', 'rcg.assayId')
        })
        .select(
          'r.id',
          'r.partnerId',
          'r.assayId',
          'r.siteId',
          'r.deviceId',
          knex.raw('LEFT(r.externalId, 100) as externalId'),
          'r.reportableSiteId',
          'r.referringSiteId',
          'r.resultSourceId',
          'r.resultTypeId',
          'r.longitude',
          'r.latitude',
          'r.sampleId',
          'r.resultCategory1',
          'r.resultCategory2',
          'r.resultStatusLogId',
          knex.raw('LEFT(r.resultDataHash, 32) as resultDataHash'),
          knex.raw('LEFT(r.assayVersion, 6) as assayVersion'),
          'r.startedOn',
          knex.raw('IFNULL(r.endedOn, r.startedOn) as endedOn'),
          knex.raw('LEFT(r.consumableSerial, 15) as consumableSerial'),
          'r.consumableExpirationDate',
          knex.raw('LEFT(r.consumableLot, 15) as consumableLot'),
          knex.raw('LEFT(r.instrumentSerial, 25) as instrumentSerial'),
          knex.raw('LEFT(r.moduleName, 15) as moduleName'),
          knex.raw('LEFT(r.moduleSerial, 15) as moduleSerial'),
          knex.raw('LEFT(r.senderVersion, 6) as senderVersion'),
          knex.raw('LEFT(r.senderOperator, 50) as senderOperator'),
          knex.raw('LEFT(r.oemData, 4) as oemData'),
          knex.raw('LEFT(r.errorCode, 4) as errorCode'),
          'r.createdOn',
          'r.createdBy',
          'r.updatedOn',
          'r.updatedBy',
          'r.reconciliationDate',
          'g.countryId as country_id',
          knex.raw('LEFT(a.externalId, 15) as assay_externalId'),
          knex.raw('LEFT(a.name, 30) as assay_name'),
          knex.raw('LEFT(a.i18nKey, 20) as assay_i18nKey'),
          'at.id as assayType_id',
          knex.raw('LEFT(at.externalId, 20) as assayType_externalId'),
          knex.raw('LEFT(at.name, 25) as assayType_name'),
          knex.raw('LEFT(at.i18nKey, 25) as assayType_i18nKey'),
          'si.disabled as site_disabled',
          knex.raw('LEFT(dms.externalId, 50) as deviceMaintenanceStatus_externalId'),
          knex.raw('LEFT(da.token, 50) as deviceApproval_token'),
          knex.raw('LEFT(sp.externalId, 32) as sample_externalId'),
          knex.raw('LEFT(rso.name, 25) as resultSource_name'),
          knex.raw('LEFT(rso.externalId, 30) as resultSource_externalId'),
          knex.raw('LEFT(rt.name, 25) as resultType_name'),
          knex.raw('LEFT(rt.externalId, 15) as resultType_externalId'),
          'rt.excluded as resultType_excluded',
          knex.raw('LEFT(rc1.name, 25) as resultCategory1_name'),
          knex.raw('LEFT(rc1.i18nKey, 40) as resultCategory1_i18nKey'),
          knex.raw('LEFT(rc2.name, 25) as resultCategory2_name'),
          knex.raw('LEFT(rc2.i18nKey, 40) as resultCategory2_i18nKey'),
          'rcg.id as resultCategoryGroup_id',
          knex.raw('LEFT(rcg.externalId, 47) as resultCategoryGroup_externalId'),
          knex.raw('LEFT(rcg.name, 45) as resultCategoryGroup_name'),
          knex.raw('LEFT(rcg.i18nKey, 65) as resultCategoryGroup_i18nKey'),
          knex.raw('LEFT(a.resultCategory1label, 25) as assay_resultCategory1Label'),
          knex.raw('LEFT(a.resultCategory1i18nKey, 40) as assay_resultCategory1Label_i18nKey'),
          knex.raw('LEFT(a.resultCategory2label, 25) as assay_resultCategory2Label'),
          knex.raw('LEFT(a.resultCategory2i18nKey, 40) as assay_resultCategory2Label_i18nKey'),
          knex.raw('rca1.requiresTreatment as resultCategory1Assay_requiresTreatment'),
          knex.raw('rca2.requiresTreatment as resultCategory2Assay_requiresTreatment'),
          'rca1.reportable as resultCategoryAssay_reportable',
          'dis.id as disease_id',
          knex.raw('LEFT(dis.name, 25) as disease_name'),
          knex.raw('LEFT(dis.externalId, 10) as disease_externalId'),
          knex.raw("LEFT(JSON_UNQUOTE(JSON_EXTRACT(r.patientData, '$.id')), 100) as patient_externalId"),
          knex.raw("LEFT(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, '$.copies')), 15) as copies"),
          knex.raw(
            "LEFT(IFNULL(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, '$.resultText')), CONCAT(IFNULL(rc1.name, ''), '|', IFNULL(rc2.name, ''))), 300) as resultText"
          ),
          knex.raw('LEFT(r.notes, 400) as notes')
        )
        .where('r.id', '>=', startId)
        .where('r.id', '<=', endId)
        .orderBy('r.id')
    })

    const batchEnd = new Date()
    const batchElapsed = ((batchEnd - batchStart) / 1000).toFixed(2)
    // eslint-disable-next-line no-console
    console.log(`\x1b[36mBatch ${i + 1}/${batches}\x1b[0m: id ${startId}-${endId} (\x1b[32m${batchElapsed}s\x1b[0m)`)
  }

  // eslint-disable-next-line no-console
  console.log(`\x1b[33mCreating Indexes on Result_READ table....`)
  await createResultReadTableIndexes(knex)
  // eslint-disable-next-line no-console
  console.log(`\x1b[33mCreating Triggers on Result_READ table....`)
  await createResultReadTriggers(knex)
  const end = new Date()
  // eslint-disable-next-line no-console
  console.log(
    `\x1b[36mpopulateResultReadOnlyTable\x1b[0m took \x1b[32m${((end - start) / 1000 / 60).toFixed(2)} min\x1b[0m`
  )
}
module.exports = { populateResultReadOnlyTable }
