const _ = require('lodash')
const { startOfDay, endOfDay, subDays, endOfMonth, getDayOfYear, getDaysInYear } = require('date-fns')

const { getConstraints } = require('../../auth/constraints')
const { knex } = require('../../db')
const { allResultCategoryToId } = require('../../shared/dictionary')
const { getOffsetFromIsoDateString, getMonthYearUserTimeZoneField } = require('../../shared/date')
const { getXdrResultCountBase } = require('../common/db')

/**
 * gx10CBaseQueryNational
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
  const currentYear = now.getFullYear()
  /**
   * we need full last 5 years, i.e. if now is 2023, then we need 2018-2022,
   * plus current year
   */
  const startYear = currentYear - 5
  const dateFrom = `${startYear}-01-01`
  minDate = new Date(dateFrom)
  maxDate = new Date(dateTo)
  /**
   * base query grouped by month
   */
  const baseQuery = getXdrResultCountBase({
    resultCategoryIds,
    dataConstraints,
    query: { ...query, minDate, maxDate },
  })
    /**
     * group by month
     */
    .select(getMonthYearUserTimeZoneField(knex, 'r.endedOn', 'yearAndMonth', offset))
    .groupBy('yearAndMonth')
  return baseQuery
}

/**
 * gx10CBaseQueryProvincial
 */
async function gx10CBaseQueryProvincial(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const now = new Date()
  const resultCategoryIds = await allResultCategoryToId()
  /**
   * based on minDate or maxDate define timezone `offset` to correctly group by month
   */
  const someDateFromUser = query.minDate || query.maxDate
  const offset = getOffsetFromIsoDateString(someDateFromUser)
  /**
   * helper func to return base query for specified dates
   */
  const getBaseQuery = ({ minDate, maxDate }) => {
    /**
     * base query grouped by month
     */
    const baseQuery = getXdrResultCountBase({
      resultCategoryIds,
      dataConstraints,
      query: { ...query, minDate, maxDate },
    })
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
   * explicitly set date range as of last 5 years.
   * we need full last 5 years, i.e. if now is 2023, then we need 2018-2022,
   * plus current year
   */
  const currentYear = now.getFullYear()
  const startYear = currentYear - 5

  return {
    baseQuerySince5YearsAgo: getBaseQuery({
      minDate: new Date(`${startYear}-01-01`), // from the start of 5 years ago
      maxDate: endOfMonth(now),
    }),
    baseQueryLast24h: getBaseQuery({
      minDate: startOfDay(subDays(now, 1)), // from the start of yesterday
      maxDate: endOfDay(now),
    }),
  }
}

/**
 * listGx10CTrendsNational
 */
async function listGx10CTrendsNational({ auth, query }) {
  const baseQuery = await gx10CBaseQueryNational(auth, query)
  let data = await baseQuery
  /**
   * for National Trend report use `count all results` value
   */
  data = data.map(d => {
    return {
      cnt: d.cntAll,
      month: d.yearAndMonth,
    }
  })
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
  // const totalDaysCurrYear = getDaysInYear(now)
  // const totalDaysPrevYear = getDaysInYear(subYears(now, 1))
  const denominator = (getDayOfYear(now) / getDaysInYear(now)) * 12
  const { baseQuerySince5YearsAgo, baseQueryLast24h } = await gx10CBaseQueryProvincial(auth, query)
  const rawSince5YearsAgo = await baseQuerySince5YearsAgo
  const rawLast24h = await baseQueryLast24h

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

  const groupedSince5YearsAgo = _.reduce(
    rawSince5YearsAgo,
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
  const groupedLast24h = _.reduce(
    rawLast24h,
    (acc, item) => {
      const { stateId, locationName } = item
      acc[stateId] = acc[stateId] || { locationName, ...emptyCounts }
      counterNames.forEach(counterName => {
        acc[stateId][counterName] += item[counterName]
      })
      return acc
    },
    {}
  )
  const data = _.reduce(
    _.keys(groupedSince5YearsAgo),
    (acc, stateId) => {
      const byState = groupedSince5YearsAgo[stateId]
      const byCurrYear = byState[currentYear]
      const byPrevYear = byState[previousYear]
      const currYearTotals = { ...emptyCounts }
      const currYearMeanPerMonth = { ...emptyCounts }
      const prevYearMeanPerMonth = { ...emptyCounts }
      const byYear = {}

      counterNames.forEach(counterName => {
        /**
         *
         */
        _.keys(byState)
          .filter(key => key !== 'locationName')
          .forEach(key => {
            const year = +key
            byYear[year] = byYear[year] || { ...emptyCounts }
            _.keys(byState[year]).forEach(month => {
              byYear[year][counterName] += byState[year][month][counterName]
              if (year === currentYear) {
                currYearTotals[counterName] += byCurrYear[month][counterName]
              } else if (year === previousYear) {
                prevYearMeanPerMonth[counterName] += byPrevYear[month][counterName]
              }
            })
          })
        currYearMeanPerMonth[counterName] = currYearTotals[counterName] / denominator
        prevYearMeanPerMonth[counterName] /= 12
      })

      const trends = _.reduce(
        _.keys(byYear),
        (acc, year) => {
          acc = [
            ...acc,
            {
              year: +year,
              ...byYear[year],
            },
          ]
          return acc
        },
        []
      )

      acc = [
        ...acc,
        {
          stateId,
          locationName: byState.locationName,
          currYearTotals,
          currYearMeanPerMonth,
          prevYearMeanPerMonth,
          trends,
        },
      ]
      return acc
    },
    []
  )

  /**
   * for each state - add field `last24h` with counts since start of yesterday
   */
  _.forEach(data, d => {
    /**
     * notice that data for last 24 hours (groupedLast24h) may not contain stateId
     * from last 5 years (data), and because of that set it to `emptyCounts` if
     * stateId is missing in `groupedLast24h`
     */
    const byState = groupedLast24h[d.stateId] || emptyCounts
    d.last24h = { ...emptyCounts }
    counterNames.forEach(counterName => {
      d.last24h[counterName] += byState[counterName]
    })
  })

  return {
    ok: true,
    data,
  }
}

module.exports = {
  listGx10CTrendsNational,
  listGx10CTrendsProvincial,
}
