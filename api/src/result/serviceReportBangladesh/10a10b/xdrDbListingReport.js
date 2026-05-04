const { addConstraints, getConstraints } = require('../../../auth/constraints')
const { knex, filterParams, filterDateRangeParams } = require('../../../db')

const { getDatesFromQuery } = require('../../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../../shared/dictionary')
const getPositiveCategoriesExternalIds = require('../../../resultCategory/service')
const { columnGroups } = require('./xdrCartridgesReport')

const xdrBySiteCounters = [
  { key: 'TOT' },
  { key: 'MTBDET' },
  { key: 'INHR' },
  { key: 'INHI' },
  { key: 'FLQR' },
  { key: 'FLQI' },
  { key: 'ETHR' },
  { key: 'ETHI' },
  { key: 'INHFLQ' },
  { key: 'INHETH' },
  { key: 'FLQETH' },
  { key: 'INHFLQETH' },
  { key: 'MTBNOTDET', getValue: row => Number(row.TOT) - Number(row.MTBDET) },
]

/**
 * Wide XDR MTB table for the "XDR by Site" sheet.
 * One row is produced per site, with one column for every counter × valid XDR dimension combination.
 */
async function getDataForReportXdrBySite(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { dateFrom, dateTo } = getDatesFromQuery(query)
  const assayIds = await allAssayToId()
  const aggRows = await getAggregatedRows(dataConstraints, dateFrom, dateTo, query, assayIds)
  const data = buildXdrBySiteRows(aggRows)

  return {
    ok: true,
    data,
  }
}

function buildXdrBySiteRows(aggRows) {
  const bySite = new Map()
  const allowedDimensionKeys = new Set(getXdrBySiteDimensionKeys())

  for (const row of aggRows) {
    const siteKey = [row.division ?? '', row.district ?? '', row.siteName ?? ''].join('\t')
    if (!bySite.has(siteKey)) {
      bySite.set(siteKey, {
        Division: row.division ?? '',
        District: row.district ?? '',
        Site: row.siteName ?? '',
        ...getEmptyXdrBySiteMetricValues(),
      })
    }

    const dimensionKey = `${row.RRDET}-${row.MtbRifUltraAt}-${row.patientHistory}-${row.sampleType}`
    if (allowedDimensionKeys.has(dimensionKey)) {
      const siteRow = bySite.get(siteKey)
      for (const counter of xdrBySiteCounters) {
        const value = counter.getValue ? counter.getValue(row) : row[counter.key]
        siteRow[`${counter.key}-${dimensionKey}`] = Number(value) || 0
      }
    }
  }

  return [...bySite.values()].sort((a, b) =>
    [a.Division, a.District, a.Site].join('\t').localeCompare([b.Division, b.District, b.Site].join('\t'))
  )
}

function getXdrBySiteDimensionKeys() {
  return columnGroups.flatMap(group =>
    group.samples.map(sample => `${group.det}-${group.site}-${group.hist}-${sample}`)
  )
}

function getEmptyXdrBySiteMetricValues() {
  return xdrBySiteCounters.reduce((acc, counter) => {
    for (const dimensionKey of getXdrBySiteDimensionKeys()) {
      acc[`${counter.key}-${dimensionKey}`] = 0
    }
    return acc
  }, {})
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
  return q
}

module.exports = {
  getDataForReportXdrDb: getDataForReportXdrBySite,
  getDataForReportXdrBySite,
  xdrBySiteCounters,
}
