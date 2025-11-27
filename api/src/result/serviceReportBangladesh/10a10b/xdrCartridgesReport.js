const { addConstraints, getConstraints } = require('../../../auth/constraints')
const { knex, filterParams, filterDateRangeParams } = require('../../../db')

const { getDatesFromQuery } = require('../../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../../shared/dictionary')
const getPositiveCategoriesExternalIds = require('../../../resultCategory/service')

const columnGroups = [
  { det: 'RRDET', site: 'OWN', hist: 'NEW', samples: ['SP', 'EP', 'ST', 'CU'] },
  { det: 'RRDET', site: 'OWN', hist: 'PREV', samples: ['SP', 'ST', 'CU'] },
  { det: 'RRDET', site: 'OTH', hist: 'NEW', samples: ['SP', 'EP', 'ST'] },
  { det: 'RRDET', site: 'OTH', hist: 'PREV', samples: ['SP', 'ST'] },
  { det: 'RRNDET', site: 'OWN', hist: 'NEW', samples: ['SP', 'EP', 'ST', 'CU'] },
  { det: 'RRNDET', site: 'OWN', hist: 'PREV', samples: ['SP', 'ST', 'CU'] },
  { det: 'RRNDET', site: 'OTH', hist: 'NEW', samples: ['SP', 'EP', 'ST'] },
  { det: 'RRNDET', site: 'OTH', hist: 'PREV', samples: ['SP', 'ST'] },
]
const rowLabels = [
  'TOT',
  'MTBDET',
  'INHR',
  'INHI',
  'FLQR',
  'FLQI',
  'ETHR',
  'ETHI',
  'INHFLQ',
  'INHETH',
  'FLQETH',
  'INHFLQETH',
]

async function getDataForReportXdrCartridges(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const { dateFrom, dateTo } = getDatesFromQuery(query)
  const assayIds = await allAssayToId()
  const data = await getData(dataConstraints, dateFrom, dateTo, query, assayIds)

  const labelToValueMap = {}
  const allowedBases = new Set()
  // Initialize mapping with all the combinations
  for (const g of columnGroups) {
    for (const sp of g.samples) {
      const base = `${g.det}-${g.site}-${g.hist}-${sp}`
      allowedBases.add(base)
      for (const rowLabel of rowLabels) {
        labelToValueMap[`${base}-${rowLabel}`] = 0
      }
    }
  }

  // Update with actual values from query result
  for (const row of data) {
    const detFlag = row.RRDET // 'RRDET' | 'RRNDET'
    const siteFlag = row.MtbRifUltraAt // 'OWN' | 'OTH'
    const historyFlag = row.patientHistory // 'NEW' | 'PREV'
    const sampleFlag = row.sampleType // 'SP' | 'EP' | 'ST' | 'CU'

    const base = `${detFlag}-${siteFlag}-${historyFlag}-${sampleFlag}`
    if (allowedBases.has(base)) {
      // Assign each rowLabel value to its labeled key
      for (const rowLabel of rowLabels) {
        const numericValue = Number(row[rowLabel]) || 0
        labelToValueMap[`${base}-${rowLabel}`] = numericValue
      }
    }
  }

  // Sum up the error/invalid/no result counts across all rows
  const summaryData = data.reduce(
    (acc, row) => {
      acc.NEW_INVALID += row.NEW_INVALID || 0
      acc.NEW_NORESULT += row.NEW_NORESULT || 0
      acc.NEW_ERROR += row.NEW_ERROR || 0
      acc.PREV_INVALID += row.PREV_INVALID || 0
      acc.PREV_NORESULT += row.PREV_NORESULT || 0
      acc.PREV_ERROR += row.PREV_ERROR || 0
      return acc
    },
    {
      NEW_INVALID: 0,
      NEW_NORESULT: 0,
      NEW_ERROR: 0,
      PREV_INVALID: 0,
      PREV_NORESULT: 0,
      PREV_ERROR: 0,
    }
  )

  return {
    ok: true,
    data: {
      ...summaryData,
      ...labelToValueMap,
    },
  }
}

async function getData(dataConstraints, dateFrom, dateTo, query, assayIds) {
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
  // const positiveResultCategories = _.values(_.pick(resultCategoryIds, getPositiveCategoriesExternalIds()))
  const srcSubquery = knex('Result as r')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as st', 'sp.sampleTypeId', 'st.id')
    .leftJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as site', 'site.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 'g.id', 'site.geographyId')
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
      'r.resultCategory1 as resultCategory1',
      'rc.externalId as resultCategoryExternalId',
      // Rif Resistance previously Detected vs Not Detected flag
      knex.raw(`IF(r.resultData ->> '$.rifResistancePreviouslyDetected' = 'Yes', 'RRDET', 'RRNDET') as RRDET`),
      knex.raw(`IF(rc.id in (${positiveResultCategoriesIds}), 1, 0) as MTBDET`),
      // Own Site vs Other Site
      knex.raw(`IF(r.resultData ->> '$.originTestLocation' = 'This site', 'OWN', 'OTH') as MtbRifUltraAt`),
      // Patient history (New/Unknown -> NEW, else PREV)
      knex.raw(`
        IF(r.patientData ->> '$.PatientHistory' IN ('Previously treated'), 'PREV', 'NEW') as patientHistory
      `),
      // Sample type mapping
      knex.raw(`CASE r.patientData ->> '$.SampleType'
        WHEN 'Pulmonary' THEN 'SP'
        WHEN 'Extra-pulmonary' THEN 'EP'
        WHEN 'Stool' THEN 'ST'
        WHEN 'Direct Culture' THEN 'CU'
        ELSE 'SP'
      END as sampleType`),
      // Totals and individual resistance flags
      knex.raw('1 as TOT'),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.INH' = 'Detected', 0) as INHR`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.INH' = 'Indeterminate', 0) as INHI`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.FLQ' = 'Detected', 0) as FLQR`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.FLQ' = 'Indeterminate', 0) as FLQI`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.ETH' = 'Detected', 0) as ETHR`),
      knex.raw(`IFNULL(r.resultData ->> '$.allResistances.ETH' = 'Indeterminate', 0) as ETHI`)
    )

  // Wrap aggregation over the subquery using Knex
  const data = await knex
    .from(srcSubquery.as('src'))
    .select(
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
    .groupBy('src.RRDET', 'src.MtbRifUltraAt', 'src.patientHistory', 'src.sampleType')

  return data
}

module.exports = {
  getDataForReportXdrCartridges,
  columnGroups,
  rowLabels,
}
