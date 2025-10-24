module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  const latestDeviceMaintenanceStatus = knex('DeviceMaintenanceStatusLog as dmsl')
    .select('dmsl.*')
    .select(knex.raw('ROW_NUMBER() OVER (PARTITION BY deviceId ORDER BY id DESC) as rn'))
    .as('dmsl')

  await knex('Result_read').insert(function () {
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
      .leftJoin('ResultCategoryAssay as rca', function () {
        this.on('r.assayId', 'rca.assayId').andOn('r.resultCategory1', 'rca.resultCategoryId')
      })
      .leftJoin(latestDeviceMaintenanceStatus, function () {
        this.on('d.id', 'dmsl.deviceId').andOn('dmsl.rn', knex.raw('1'))
      })
      .leftJoin('DeviceMaintenanceStatus as dms', 'dmsl.deviceMaintenanceStatusId', 'dms.id')
      .leftJoin('DeviceApproval as da', 'd.deviceApprovalId', 'da.id')
      .distinct()
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
        'r.endedOn',
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
        knex.raw('LEFT(a.name, 30) as assay_name'),
        knex.raw('LEFT(a.i18nKey, 20) as assay_i18nKey'),
        knex.raw('LEFT(a.externalId, 15) as assay_externalId'),
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
        knex.raw('LEFT(a.resultCategory1label, 25) as assay_resultCategory1Label'),
        knex.raw('LEFT(a.resultCategory1i18nKey, 40) as assay_resultCategory1Label_i18nKey'),
        knex.raw('LEFT(a.resultCategory2label, 25) as assay_resultCategory2Label'),
        knex.raw('LEFT(a.resultCategory2i18nKey, 40) as assay_resultCategory2Label_i18nKey'),
        'rca.requiresTreatment as resultCategoryAssay_requiresTreatment',
        knex.raw('LEFT(dis.name, 25) as disease_name'),
        knex.raw('LEFT(dis.externalId, 10) as disease_externalId'),
        knex.raw("LEFT(JSON_UNQUOTE(JSON_EXTRACT(r.patientData, '$.id')), 100) as patient_externalId"),
        knex.raw("LEFT(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, '$.copies')), 15) as copies"),
        knex.raw("LEFT(JSON_UNQUOTE(JSON_EXTRACT(r.resultData, '$.resultText')), 300) as resultText"),
        knex.raw('LEFT(r.notes, 400) as notes')
      )
      .orderBy('r.id')
  })
}
