const _ = require('lodash')
const { endOfMonth, startOfMonth, startOfYear, subMonths } = require('date-fns')

const { getConstraints } = require('../../auth/constraints')
const { knex } = require('../../db')
const { allResultCategoryToId } = require('../../shared/dictionary')
const { getOffsetFromIsoDateString, getMonthYearUserTimeZoneField } = require('../../shared/date')
const { getXdrResultCountBase } = require('../common/db')

/**
 * reportGx10CBaseQueryNational
 */
async function gx10CBaseQueryNational(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const now = new Date()
  const resultCategoryIds = await allResultCategoryToId()
  /**
   * based on minDate or maxDate define timezone `offset` to correctly group by month
   */
  let { minDate, maxDate } = query
  const someDateFromUser = minDate || maxDate
  const offset = getOffsetFromIsoDateString(someDateFromUser)
  /**
   * explicitly set date range as of last 5 years
   */
  const dateTo = endOfMonth(now)
  const dateFrom = startOfMonth(subMonths(now, 60))
  minDate = knex.raw(`'${new Date(dateFrom).toISOString()}'`)
  maxDate = knex.raw(`'${new Date(dateTo).toISOString()}'`)
  /**
   * base query grouped by month
   */
  const baseQuery = getXdrResultCountBase({ minDate, maxDate, resultCategoryIds, dataConstraints, query })
    /**
     * group by month
     */
    .select(getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'yearAndMonth', offset))
    .groupBy('yearAndMonth')
  return baseQuery
}

/**
 * reportGx10CBaseQueryProvincial
 */
async function gx10CBaseQueryProvincial(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const now = new Date()
  const resultCategoryIds = await allResultCategoryToId()
  /**
   * based on minDate or maxDate define timezone `offset` to correctly group by month
   */
  let { minDate, maxDate } = query
  const someDateFromUser = minDate || maxDate
  const offset = getOffsetFromIsoDateString(someDateFromUser)
  /**
   * explicitly set date range as of this and last year
   */
  const dateTo = endOfMonth(now)
  const dateFrom = startOfYear(subMonths(now, 12)) // from the start of previous year
  minDate = knex.raw(`'${new Date(dateFrom).toISOString()}'`)
  maxDate = knex.raw(`'${new Date(dateTo).toISOString()}'`)
  /**
   * base query grouped by month
   */
  const baseQuery = getXdrResultCountBase({ minDate, maxDate, resultCategoryIds, dataConstraints, query })
    /**
     * group by month and state
     */
    .select(
      getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'yearAndMonth', offset),
      'g.stateId',
      'st.name as locationName' // state name
    )
    .whereNotNull('g.stateId')
    .groupBy('g.stateId', 'yearAndMonth')
  return baseQuery
}

/**
 * listGx10CTrendsNational
 */
async function listGx10CTrendsNational({ auth, query }) {
  const baseQuery = await gx10CBaseQueryNational(auth, query)
  const data = await baseQuery
  return {
    ok: true,
    data,
  }
}

/**
 * listGx10CTrendsProvincial
 */
async function listGx10CTrendsProvincial({ auth, query }) {
  const now = new Date()
  const baseQuery = await gx10CBaseQueryProvincial(auth, query)
  const rawData = await baseQuery

  const emptyCounts = {
    cntAll: 0,
    cnt_mtb: 0,
    cnt_inh: 0,
    cnt_flq: 0,
    cnt_amk: 0,
    cnt_kan: 0,
    cnt_cap: 0,
    cnt_eth: 0,
    cnt_Invalid: 0,
    cnt_NoResult: 0,
    cnt_Error: 0,
  }
  const counterNames = _.keys(emptyCounts)
  const currentYear = now.getFullYear()
  const previousYear = now.getFullYear() - 1
  const grouped = _.reduce(
    rawData,
    (acc, item) => {
      const { stateId, yearAndMonth, locationName } = item
      const [year, month] = yearAndMonth.split('-')
      acc[stateId] = acc[stateId] || { locationName }
      acc[stateId][year] = acc[stateId][year] || {}
      acc[stateId][year][month] = acc[stateId][year][month] || { ...emptyCounts }
      counterNames.forEach(counterName => {
        acc[stateId][year][month][counterName] += item[counterName]
      })
      return acc
    },
    {}
  )
  const data = _.reduce(
    _.keys(grouped),
    (acc, stateId) => {
      const byState = grouped[stateId]
      const byCurrYear = byState[currentYear]
      const byPrevYear = byState[previousYear]
      const currYearTotals = { ...emptyCounts }
      const prevYearMeanPerMonth = { ...emptyCounts }

      counterNames.forEach(counterName => {
        _.keys(byCurrYear).forEach(month => {
          currYearTotals[counterName] += byCurrYear[month][counterName]
        })
        _.keys(byPrevYear).forEach(month => {
          prevYearMeanPerMonth[counterName] += byPrevYear[month][counterName]
        })
        /**
         * check if `mean` to calculate per only months with tests
         */
        // const totalMonths = _.keys(byPrevYear).length
        // if (totalMonths > 0) {
        //   prevYear[counterName] /= totalMonths
        // }
        prevYearMeanPerMonth[counterName] /= 12
      })

      acc = [
        ...acc,
        {
          stateId,
          locationName: byState.locationName,
          currYearTotals,
          prevYearMeanPerMonth,
        },
      ]
      return acc
    },
    []
  )

  return {
    ok: true,
    data,
  }
}

module.exports = {
  listGx10CTrendsNational,
  listGx10CTrendsProvincial,
}
