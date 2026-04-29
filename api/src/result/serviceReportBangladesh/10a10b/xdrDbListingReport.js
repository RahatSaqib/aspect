const { addConstraints, getConstraints } = require('../../../auth/constraints')
const { knex, filterParams, filterDateRangeParams } = require('../../../db')

const { getDatesFromQuery } = require('../../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../../shared/dictionary')
const getPositiveCategoriesExternalIds = require('../../../resultCategory/service')

const RRDET_LABEL = {
  RRDET: 'MTB XDR Test for RR Detected',
  RRNDET: 'MTB XDR Test for RR Not Detected',
}
const ORIGIN_LABEL = {
  OWN: 'MTB RIF Ultra Test at Own Site',
  OTH: 'MTB RIF Ultra Test at Other Site',
}
const PATIENT_HISTORY_LABEL = {
  NEW: 'Presumptive-Unknown/New',
  PREV: 'Presumptive-Previously Treated ',
}
const SAMPLE_LABEL = {
  SP: 'Sputum',
  EP: 'EP',
  ST: 'Stool',
  CU: 'Direct Culture',
}

/**
 * Long-form XDR MTB listing for the XDR_DB sheet (one row per metric per geography/site slice).
 * Aggregation matches `xdrCartridgesReport.getData`; rows are expanded in JS instead of SQL UNION ALL.
 */
async function getDataForReportXdrDb(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { dateFrom, dateTo } = getDatesFromQuery(query)
  const assayIds = await allAssayToId()
  const aggRows = await getAggregatedRows(dataConstraints, dateFrom, dateTo, query, assayIds)
  const data = aggRows
    .flatMap(row => expandAggRowToListingRows(row))
    .sort((a, b) => {
      const key = x => [x.Division, x.District, x.Site, x.Order, x.NumberOf].join('\t')
      return key(a).localeCompare(key(b))
    })

  return {
    ok: true,
    data,
  }
}

function expandAggRowToListingRows(row) {
  const base = {
    Division: row.division ?? '',
    District: row.district ?? '',
    Resistance: RRDET_LABEL[row.RRDET] ?? row.RRDET,
    Source: ORIGIN_LABEL[row.MtbRifUltraAt] ?? row.MtbRifUltraAt,
    Treatment: PATIENT_HISTORY_LABEL[row.patientHistory] ?? row.patientHistory,
    Sample: SAMPLE_LABEL[row.sampleType] ?? row.sampleType,
    Site: row.siteName ?? '',
    Fake: '',
  }

  const metrics = [
    { name: 'NEW_INVALID', qty: row.NEW_INVALID, order: 10, include: () => row.NEW_INVALID !== 0 },
    { name: 'NEW_NORESULT', qty: row.NEW_NORESULT, order: 20, include: () => row.NEW_NORESULT !== 0 },
    { name: 'NEW_ERROR', qty: row.NEW_ERROR, order: 30, include: () => row.NEW_ERROR !== 0 },
    { name: 'PREV_INVALID', qty: row.PREV_INVALID, order: 40, include: () => row.PREV_INVALID !== 0 },
    { name: 'PREV_NORESULT', qty: row.PREV_NORESULT, order: 50, include: () => row.PREV_NORESULT !== 0 },
    { name: 'PREV_ERROR', qty: row.PREV_ERROR, order: 60, include: () => row.PREV_ERROR !== 0 },
    { name: '01 - XDR Test', qty: row.TOT, order: 70, include: () => true },
    { name: '02 - MTB Detected', qty: row.MTBDET, order: 80, include: () => row.MTBDET !== 0 },
    { name: '03 - INH Resistant', qty: row.INHR, order: 120, include: () => true },
    { name: '04 - INH Indeterminate', qty: row.INHI, order: 90, include: () => true },
    { name: '05 - FLQ Resistant', qty: row.FLQR, order: 130, include: () => true },
    { name: '06 - FLQ Indeterminate', qty: row.FLQI, order: 100, include: () => true },
    { name: '07 - ETH Resistant', qty: row.ETHR, order: 140, include: () => true },
    { name: '08 - ETH Indeterminate', qty: row.ETHI, order: 110, include: () => true },
    { name: '09 - INH & FLQ Resistant', qty: row.INHFLQ, order: 170, include: () => true },
    { name: '10 - INH & ETH Resistant', qty: row.INHETH, order: 180, include: () => true },
    { name: '11 - FLQ & ETH Resistant', qty: row.FLQETH, order: 190, include: () => true },
    { name: '12 - INH, FLQ & ETH  Resistant', qty: row.INHFLQETH, order: 200, include: () => true },
    {
      name: '13 - MTB Not Detected',
      qty: Number(row.TOT) - Number(row.MTBDET),
      order: 210,
      include: () => true,
    },
  ]

  return metrics
    .filter(m => m.include())
    .map(m => ({
      ...base,
      NumberOf: m.name,
      Qty: m.qty,
      Order: m.order,
    }))
}

async function getAggregatedRows(dataConstraints, dateFrom, dateTo, query, assayIds) {
  const resultCategoryIds = await allResultCategoryToId()
  const invalidCategories = [
    resultCategoryIds.Invalid,
    resultCategoryIds.Indeterminate,
    resultCategoryIds.NoResult,
    resultCategoryIds.Error,
  ]
  const positiveResultCategoriesIds = getPositiveCategoriesExternalIds().map(
    rcExternalId => resultCategoryIds[rcExternalId]
  )

  const srcSubquery = knex('Result as r')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as spty', 'sp.sampleTypeId', 'spty.id')
    .leftJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as site', 'site.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 'g.id', 'site.geographyId')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as lg', 'g.lgaId', 'lg.id')
    .modify(addConstraints, dataConstraints, {
      result: 'r',
      site: 'site',
      geography: 'g',
      assay: 'a',
    })
    .modify(filterDateRangeParams, { minDate: dateFrom, maxDate: dateTo }, 'r.endedOn')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 'site.name',
    })
    .where('a.id', assayIds.GxMtbXdr)
    .select(
      'st.name as division',
      'lg.name as district',
      'site.name as siteName',
      'r.resultCategory1 as resultCategory1',
      'rc.externalId as resultCategoryExternalId',
      knex.raw(`IF(r.resultData ->> '$.rifResistancePreviouslyDetected' = 'No', 'RRNDET', 'RRDET') as RRDET`),
      knex.raw(`IF(rc.id in (${positiveResultCategoriesIds}), 1, 0) as MTBDET`),
      knex.raw(`IF(r.resultData ->> '$.originTestLocation' = 'This site', 'OWN', 'OTH') as MtbRifUltraAt`),
      knex.raw(`
        IF(r.patientData ->> '$.PatientHistory' IN ('Previously treated'), 'PREV', 'NEW') as patientHistory
      `),
      knex.raw(`CASE r.patientData ->> '$.SampleType'
        WHEN 'Pulmonary' THEN 'SP'
        WHEN 'Extra-pulmonary' THEN 'EP'
        WHEN 'Stool' THEN 'ST'
        WHEN 'Direct Culture' THEN 'CU'
        ELSE 'SP'
      END as sampleType`),
      knex.raw('1 as TOT'),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.INH' = 'Detected', 0) as INHR`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.INH' = 'Indeterminate', 0) as INHI`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.FLQ' = 'Detected', 0) as FLQR`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.FLQ' = 'Indeterminate', 0) as FLQI`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.ETH' = 'Detected', 0) as ETHR`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.ETH' = 'Indeterminate', 0) as ETHI`)
    )

  const q = knex
    .from(srcSubquery.as('src'))
    .select(
      'src.division',
      'src.district',
      'src.siteName',
      'src.RRDET',
      'src.MtbRifUltraAt',
      'src.patientHistory',
      'src.sampleType',
      knex.raw("SUM(IF(src.patientHistory = 'NEW' and src.resultCategoryExternalId = 'Invalid', 1, 0)) as NEW_INVALID"),
      knex.raw(
        "SUM(IF(src.patientHistory = 'NEW' and src.resultCategoryExternalId = 'NoResult', 1, 0)) as NEW_NORESULT"
      ),
      knex.raw("SUM(IF(src.patientHistory = 'NEW' and src.resultCategoryExternalId = 'Error', 1, 0)) as NEW_ERROR"),
      knex.raw(
        "SUM(IF(src.patientHistory = 'PREV' and src.resultCategoryExternalId = 'Invalid', 1, 0)) as PREV_INVALID"
      ),
      knex.raw(
        "SUM(IF(src.patientHistory = 'PREV' and src.resultCategoryExternalId = 'NoResult', 1, 0)) as PREV_NORESULT"
      ),
      knex.raw("SUM(IF(src.patientHistory = 'PREV' and src.resultCategoryExternalId = 'Error', 1, 0)) as PREV_ERROR"),
      knex.raw(`SUM(IF(src.resultCategory1 NOT IN (${invalidCategories}), src.TOT, 0)) as TOT`),
      knex.raw(`SUM(IF(src.resultCategory1 NOT IN (${invalidCategories}), src.MTBDET, 0)) as MTBDET`),
      knex.raw(`SUM(IF(src.resultCategory1 NOT IN (${invalidCategories}), src.INHI, 0)) as INHI`),
      knex.raw(`SUM(IF(src.resultCategory1 NOT IN (${invalidCategories}), src.FLQI, 0)) as FLQI`),
      knex.raw(`SUM(IF(src.resultCategory1 NOT IN (${invalidCategories}), src.ETHI, 0)) as ETHI`),
      knex.raw(
        `SUM(CASE WHEN src.resultCategory1 NOT IN (${invalidCategories})
        AND src.INHR = 1 AND src.FLQR = 0 AND src.ETHR = 0 THEN 1 ELSE 0 END) as INHR`
      ),
      knex.raw(
        `SUM(CASE WHEN src.resultCategory1 NOT IN (${invalidCategories})
        AND src.INHR = 0 AND src.FLQR = 1 AND src.ETHR = 0 THEN 1 ELSE 0 END) as FLQR`
      ),
      knex.raw(
        `SUM(CASE WHEN src.resultCategory1 NOT IN (${invalidCategories})
        AND src.INHR = 0 AND src.FLQR = 0 AND src.ETHR = 1 THEN 1 ELSE 0 END) as ETHR`
      ),
      knex.raw(
        `SUM(CASE WHEN src.resultCategory1 NOT IN (${invalidCategories})
        AND src.INHR = 1 AND src.FLQR = 1 AND src.ETHR = 0 THEN 1 ELSE 0 END) as INHFLQ`
      ),
      knex.raw(
        `SUM(CASE WHEN src.resultCategory1 NOT IN (${invalidCategories})
        AND src.INHR = 1 AND src.FLQR = 0 AND src.ETHR = 1 THEN 1 ELSE 0 END) as INHETH`
      ),
      knex.raw(
        `SUM(CASE WHEN src.resultCategory1 NOT IN (${invalidCategories})
        AND src.INHR = 0 AND src.FLQR = 1 AND src.ETHR = 1 THEN 1 ELSE 0 END) as FLQETH`
      ),
      knex.raw(
        `SUM(CASE WHEN src.resultCategory1 NOT IN (${invalidCategories})
        AND src.INHR = 1 AND src.FLQR = 1 AND src.ETHR = 1 THEN 1 ELSE 0 END) as INHFLQETH`
      )
    )
    .groupBy(
      'src.division',
      'src.district',
      'src.siteName',
      'src.RRDET',
      'src.MtbRifUltraAt',
      'src.patientHistory',
      'src.sampleType'
    )
  console.log('\x1b[1;36m', '🚀 ➜ q:', q.toString())
  return q
}

module.exports = {
  getDataForReportXdrDb,
}
