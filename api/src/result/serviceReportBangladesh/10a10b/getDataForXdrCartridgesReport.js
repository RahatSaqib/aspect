const { endOfMonth, startOfMonth, subMonths } = require('date-fns')
const dateFormat = require('date-fns/format')

const { getUser } = require('../../auth/service')
const { addConstraints, getConstraints } = require('../../auth/constraints')
const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../../db')
const { getDeviceInfo } = require('../../device/common/db')
const { getDatesFromQuery } = require('../../shared/date')
const { allAssayToId, allResultCategoryToId } = require('../../shared/dictionary')
const { convertCsvToArrayOfNumbers } = require('../../shared/string')
const getPositiveCategoriesExternalIds = require('../../resultCategory/service')
const { createFormObject } = require('../../forms/service')

async function getDataForXdrCartridgesReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  // Resolve date range using shared helper and normalize order
  const { dateFrom, dateTo } = (() => {
    const dates = getDatesFromQuery(query)
    let { dateFrom: df } = dates
    const { dateTo: dt } = dates
    if (df >= dt) {
      df = subMonths(dt, 1)
    }
    return { dateFrom: df, dateTo: dt }
  })()

  const assayIds = await allAssayToId()

  // Build subquery as a composable Knex query per database_access.md patterns
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
      // Detected vs Not Detected flag
      knex.raw(`IF(rc.externalId = 'Detected', 'DET', 'NDET') as DET`),
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
  const data = await knex
    .from(srcSubquery.as('src'))
    .select(
      'src.DET',
      'src.MtbRifUltraAt',
      'src.patientHistory',
      'src.sampleType',
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

  // Re-process aggregated rows into a label -> value map suited for Excel templating
  // Build full grid with zeros so that any missing combination is still present
  const firstLevelValues = ['DET', 'NDET'] // Detected / Not Detected
  const secondLevelValues = ['OWN', 'OTH'] // Own Site / Other Site
  const thirdLevelValues = ['NEW', 'PREV'] // New History / Previously Treated
  const fourthLevelValues = ['SP', 'EP', 'ST', 'CU'] // Sputum / Extrapulmonary / Stool / Direct Culture
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

  // Initialize all combinations to 0
  for (const first of firstLevelValues) {
    for (const second of secondLevelValues) {
      for (const third of thirdLevelValues) {
        for (const fourth of fourthLevelValues) {
          const base = `${first}-${second}-${third}-${fourth}`
          for (const resistance of rowLabelPart) {
            labelToValueMap[`${base}-${resistance}`] = 0
          }
        }
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

    // Assign each metric value to its labeled key
    for (const metric of rowLabelPart) {
      const numericValue = Number(row[metric]) || 0
      labelToValueMap[`${base}-${metric}`] = numericValue
    }
  }

  return {
    ok: true,
    data: labelToValueMap,
  }
}

module.exports = {
  getDataForXdrCartridgesReport,
}
