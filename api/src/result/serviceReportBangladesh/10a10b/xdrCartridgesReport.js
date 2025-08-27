const { subMonths } = require('date-fns')

const { addConstraints, getConstraints } = require('../../../auth/constraints')
const { knex, filterParams, filterDateRangeParams } = require('../../../db')

const { getDatesFromQuery } = require('../../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../../shared/dictionary')
const getPositiveCategoriesExternalIds = require('../../../resultCategory/service')

async function getDataForReportXdrCartridges(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  // Resolve date range using shared helper and normalize order
  const { dateFrom, dateTo } = getDates(query)()

  const assayIds = await allAssayToId()

  // Build subquery as a composable Knex query per database_access.md patterns
  const data = await getData(dataConstraints, dateFrom, dateTo, query, assayIds)

  // Re-process aggregated rows into a label -> value map suited for a mapping
  const columnGroups = [
    { det: 'DET', site: 'OWN', hist: 'NEW', samples: ['SP', 'EP', 'ST', 'CU'] },
    { det: 'DET', site: 'OWN', hist: 'PREV', samples: ['SP', 'ST', 'CU'] },
    { det: 'DET', site: 'OTH', hist: 'NEW', samples: ['SP', 'EP', 'ST'] },
    { det: 'DET', site: 'OTH', hist: 'PREV', samples: ['SP', 'ST'] },
    { det: 'NDET', site: 'OWN', hist: 'NEW', samples: ['SP', 'EP', 'ST', 'CU'] },
    { det: 'NDET', site: 'OWN', hist: 'PREV', samples: ['SP', 'ST', 'CU'] },
    { det: 'NDET', site: 'OTH', hist: 'NEW', samples: ['SP', 'EP', 'ST'] },
    { det: 'NDET', site: 'OTH', hist: 'PREV', samples: ['SP', 'ST'] },
  ]
  const rowLabelPart = [
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

  const labelToValueMap = {}
  const allowedBases = new Set()
  // Initialize only the combinations that exist in the sheet (24 columns x 12 rows)
  for (const g of columnGroups) {
    for (const sp of g.samples) {
      const base = `${g.det}-${g.site}-${g.hist}-${sp}`
      allowedBases.add(base)
      for (const metric of rowLabelPart) {
        labelToValueMap[`${base}-${metric}`] = 0
      }
    }
  }

  // Fill actual values from query result
  for (const row of data) {
    const detFlag = row.DET // 'DET' | 'NDET'
    const siteFlag = row.MtbRifUltraAt // 'OWN' | 'OTH'
    // Map query 'TRE' to presentation 'PREV'
    const historyFlag = row.patientHistory === 'TRE' ? 'PREV' : row.patientHistory // 'NEW' | 'PREV'
    const sampleFlag = row.sampleType // 'SP' | 'EP' | 'ST' | 'CU'

    const base = `${detFlag}-${siteFlag}-${historyFlag}-${sampleFlag}`
    if (allowedBases.has(base)) {
      // Assign each metric value to its labeled key
      for (const metric of rowLabelPart) {
        const numericValue = Number(row[metric]) || 0
        labelToValueMap[`${base}-${metric}`] = numericValue
      }
    }
  }

  return {
    ok: true,
    data: {
      NEW_INVALID: data[0]?.NEW_INVALID || 0,
      NEW_NORESULT: data[0]?.NEW_NORESULT || 0,
      NEW_ERROR: data[0]?.NEW_ERROR || 0,
      PREV_INVALID: data[0]?.PREV_INVALID || 0,
      PREV_NORESULT: data[0]?.PREV_NORESULT || 0,
      PREV_ERROR: data[0]?.PREV_ERROR || 0,
      ...labelToValueMap,
    },
  }
}

module.exports = {
  getDataForReportXdrCartridges,
}

function getDates(query) {
  return () => {
    const dates = getDatesFromQuery(query)
    let { dateFrom: df } = dates
    const { dateTo: dt } = dates
    if (df >= dt) {
      df = subMonths(dt, 1)
    }
    return { dateFrom: df, dateTo: dt }
  }
}

async function getData(dataConstraints, dateFrom, dateTo, query, assayIds) {
  const resultCategoryIds = await allResultCategoryToId()
  const positiveResultCategoriesIds = getPositiveCategoriesExternalIds().map(
    rcExternalId => resultCategoryIds[rcExternalId]
  )
  // const positiveResultCategories = _.values(_.pick(resultCategoryIds, getPositiveCategoriesExternalIds()))
  const srcSubquery = knex('Result as r')
    .leftJoin('Sample as sp', 'r.sampleId', 'sp.id')
    .leftJoin('SampleType as st', 'sp.sampleTypeId', 'st.id')
    .leftJoin('ResultCategory as rc', 'r.resultCategory1', 'rc.id')
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
      'rc.externalId as resultCategoryExternalId',
      // Detected vs Not Detected flag
      knex.raw(`IF(rc.id in (${positiveResultCategoriesIds}), 'DET', 'NDET') as DET`),
      // Own Site vs Other Site
      knex.raw(`IF(r.resultData ->> '$.customFieldData."2000".key' = 0, 'OWN', 'OTH') as MtbRifUltraAt`),
      // Patient history (New/Unknown -> NEW, else TRE)
      knex.raw(`
        IF(r.resultData ->> '$.customFieldData."12012".key' IN ('unknown','new'), 'NEW', 'TRE') as patientHistory
      `),
      // Sample type mapping
      knex.raw(`CASE r.resultData ->> '$.customFieldData."1211".key'
        WHEN 'pulmonary' THEN 'SP'
        WHEN 'extra' THEN 'EP'
        WHEN 'stool' THEN 'ST'
        WHEN 'culture' THEN 'CU'
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
    .orderBy('r.id', 'desc')

  // Wrap aggregation over the subquery using Knex
  const dataQ = knex
    .from(srcSubquery.as('src'))
    .select(
      'src.DET',
      'src.MtbRifUltraAt',
      'src.patientHistory',
      'src.sampleType',
      knex.raw('IF(src.patientHistory = "NEW" and src.resultCategoryExternalId = "Invalid", 1, 0) as NEW_INVALID'),
      knex.raw('IF(src.patientHistory = "NEW" and src.resultCategoryExternalId = "NoResult", 1, 0) as NEW_NORESULT'),
      knex.raw('IF(src.patientHistory = "NEW" and src.resultCategoryExternalId = "Error", 1, 0) as NEW_ERROR'),
      knex.raw('IF(src.patientHistory = "TRE" and src.resultCategoryExternalId = "Invalid", 1, 0) as PREV_INVALID'),
      knex.raw('IF(src.patientHistory = "TRE" and src.resultCategoryExternalId = "NoResult", 1, 0) as PREV_NORESULT'),
      knex.raw('IF(src.patientHistory = "TRE" and src.resultCategoryExternalId = "Error", 1, 0) as PREV_ERROR'),
      knex.raw('SUM(src.TOT) as TOT'),
      knex.raw('SUM(src.INHR) as INHR'),
      knex.raw('SUM(src.INHI) as INHI'),
      knex.raw('SUM(src.FLQR) as FLQR'),
      knex.raw('SUM(src.FLQI) as FLQI'),
      knex.raw('SUM(src.ETHR) as ETHR'),
      knex.raw('SUM(src.ETHI) as ETHI'),
      knex.raw('SUM(CASE WHEN src.INHR = 1 AND src.FLQR = 1 THEN 1 ELSE 0 END) as INHFLQ'),
      knex.raw('SUM(CASE WHEN src.INHR = 1 AND src.ETHR = 1 THEN 1 ELSE 0 END) as INHETH'),
      knex.raw('SUM(CASE WHEN src.FLQR = 1 AND src.ETHR = 1 THEN 1 ELSE 0 END) as FLQETH'),
      knex.raw('SUM(CASE WHEN src.INHR = 1 AND src.FLQR = 1 AND src.ETHR = 1 THEN 1 ELSE 0 END) as INHFLQETH')
    )
    .groupBy('src.DET', 'src.MtbRifUltraAt', 'src.patientHistory', 'src.sampleType')
    .orderBy(['src.DET', 'src.MtbRifUltraAt', 'src.patientHistory', 'src.sampleType'])

  const data = await dataQ
  return data
}
