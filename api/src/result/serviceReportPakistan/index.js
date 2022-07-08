const { subMonths } = require('date-fns')

const { addConstraints, getConstraints } = require('../../auth/constraints')
const { knex, filterParams, filterDateRangeParams } = require('../../db')
const { getDatesFromQuery } = require('../../shared/date')
const {
  allAssayToId,
  allResultCategoryToId,
} = require('../../shared/dictionary')

/**
 * **************************************
 * helpers
 * **************************************
 */
// ----------------
const counter = (id, condition) =>
  knex.raw(`
      DISTINCT
      CASE
        WHEN ${condition}
        THEN ${id}
        ELSE null
      END
    `)
// ----------------
const countXdr = value =>
  counter(
    'r.id',
    `
      JSON_SEARCH(
        r.resultData ->> '$.detectedResistance[*]',
        'one',
        '${value}'
      ) IS NOT NULL
    `
  )

/**
 * getReportXdrDevicesSummary
 */
async function getReportXdrDevicesSummary(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)

  const dates = getDatesFromQuery(query)
  let { dateFrom } = dates
  const { dateTo } = dates
  if (dateFrom >= dateTo) {
    dateFrom = subMonths(dateTo, 1)
  }

  const assayIds = await allAssayToId()
  const resultCategoryIds = await allResultCategoryToId()

  const countsBase = knex('Result as r')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .innerJoin('DeviceType as dt', 'dt.id', 'd.deviceTypeId')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .leftOuterJoin('Site as s', 's.id', 'r.siteId')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .whereIn('a.id', [assayIds.GxMtbXdr])
    .modify(addConstraints, dataConstraints, {
      site: 's',
      geography: 'g',
      result: 'r',
    })
    .modify(
      filterDateRangeParams,
      { minDate: dateFrom, maxDate: dateTo },
      'r.endedOn'
    )
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      siteName: 's.name',
    })
    .select('st.name as state', 'st.id as stateId')
    .groupBy('st.id')
    .count({
      totalPmdtSites: knex.raw('DISTINCT s.id'), // -> to be changed in follow-up
      totalXdrSites: knex.raw('DISTINCT s.id'), // -> to be changed in follow-up
      cntAll: knex.raw('DISTINCT r.id'),
      cnt_mtb: countXdr('MTB'),
      cnt_inh: countXdr('INH'),
      cnt_flq: countXdr('FLQ'),
      cnt_amk: countXdr('AMK'),
      cnt_kan: countXdr('KAN'),
      cnt_cap: countXdr('CAP'),
      cnt_eth: countXdr('ETH'),
      cnt_Invalid: counter(
        'r.id',
        `r.resultCategory1 = ${resultCategoryIds.Invalid}`
      ),
      cnt_NoResult: counter(
        'r.id',
        `r.resultCategory1 = ${resultCategoryIds.NoResult}`
      ),
      cnt_Error: counter(
        'r.id',
        `r.resultCategory1 = ${resultCategoryIds.Error}`
      ),
    })

  const counterField = name => knex.raw(`IFNULL(_sub.${name}, 0) as ${name}`)
  const data = await knex('State as st')
    .innerJoin('Geography as g', 'g.stateId', 'st.id')
    .leftJoin(countsBase.as('_sub'), 'st.id', '_sub.stateId')
    .modify(addConstraints, dataConstraints, { geography: 'g' })
    .select(
      'st.name as stateName',
      'st.id as stateId',
      counterField('totalPmdtSites'),
      counterField('totalXdrSites'),
      counterField('cntAll'),
      counterField('cnt_mtb'),
      counterField('cnt_inh'),
      counterField('cnt_flq'),
      counterField('cnt_amk'),
      counterField('cnt_kan'),
      counterField('cnt_cap'),
      counterField('cnt_eth'),
      counterField('cnt_Invalid'),
      counterField('cnt_NoResult'),
      counterField('cnt_Error')
    )
    .distinct()
    .orderBy('st.name')

  return {
    ok: true,
    total: data.length,
    length: data.length,
    data,
  }
}

module.exports = {
  getReportXdrDevicesSummary,
}
