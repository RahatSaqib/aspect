const { format, subMonths, endOfMonth } = require('date-fns')
const { utcToZonedTime } = require('date-fns-tz')
const _ = require('lodash')
const {
  getMonthYearExpressionFromFieldInTimeZone,
  getWorkingDays,
  getUtcMonthBoundariesInTimezone,
  getUtcDayBoundariesInTimezone,
} = require('../shared/date')
const { getConstraints, addConstraints, getUserFromCredentials } = require('../auth/constraints')
const { knex } = require('../db')
const { getPartnerWorkingDaysConfig } = require('../partner/common/db')

async function getDevicePerformance(request) {
  const { auth, params } = request
  const { deviceId } = params
  const dataConstraints = await getConstraints(auth.credentials)
  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA } = user

  const now = new Date()

  // Compute UTC-equivalent boundaries for the 12-month window in the country timezone.
  // Comparing raw endedOn against these UTC values lets MySQL use the
  // (deviceId, endedOn) index as a range scan instead of evaluating
  // CONVERT_TZ() on every row in the WHERE clause.
  const { start: periodStart } = getUtcMonthBoundariesInTimezone(subMonths(now, 12), timezoneIANA)
  const { end: periodEnd } = getUtcDayBoundariesInTimezone(now, timezoneIANA)

  // Local representation of now — used only for month-label iteration and display,
  // not for any SQL comparison.
  const nowLocal = utcToZonedTime(now, timezoneIANA)

  const devicePerformanceQuery = knex('Result as r')
    .leftJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .modify(
      addConstraints,
      dataConstraints,
      { result: 'r', device: 'd' },
      { showUndeployedDevices: true, showDecommissionedDevices: true }
    )
    .where('r.deviceId', deviceId)
    .where('r.endedOn', '>=', periodStart)
    .where('r.endedOn', '<=', periodEnd)
    .select([
      knex.raw('count(r.id) as totalResult'),
      knex.raw(`sum(rc1.externalId = 'Error') as errorCount`),
      // CONVERT_TZ here is in SELECT/GROUP BY only — does not affect index usage.
      getMonthYearExpressionFromFieldInTimeZone(knex, 'r.endedOn', 'monthTested', timezoneIANA),
      knex.raw(
        // last day of the month, or today if result.endedOn is in the current month
        `CASE
          WHEN DATE(NOW()) < LAST_DAY(r.endedOn)
          THEN DATE(CONVERT_TZ(NOW(), "+00:00","${timezoneIANA}"))
          ELSE DATE(LAST_DAY(r.endedOn))
        END as lastDayOfMonth`
      ),
      'd.dailyTestCapacity',
    ])
    .groupBy('monthTested', 'lastDayOfMonth')

  const errorCategoryQuery = knex('ResultCategory as r').where('r.externalId', 'Error').first('r.id as errorCategoryId')

  const resultsByCategoryQuery = knex('FactResultsDeviceByCategory1 as f')
    .innerJoin('Device as d', 'f.deviceId', 'd.id')
    .innerJoin('Assay as a', 'f.assayId', 'a.id')
    .modify(
      addConstraints,
      dataConstraints,
      { device: 'd', assay: 'a' },
      { showUndeployedDevices: true, showDecommissionedDevices: true }
    )
    .where('f.days', 365)
    .groupBy('f.resultCategory1')
    .select([knex.raw('f.resultCategory1 as resultCategoryId'), knex.raw(`sum(f.resultCount) as resultCount`)])

  // All four queries are independent — run them in parallel.
  const [devicePerformance, errorCategoryRow, resultsByCategory, customWorkingDaysConfig] = await Promise.all([
    devicePerformanceQuery,
    errorCategoryQuery,
    resultsByCategoryQuery,
    getPartnerWorkingDaysConfig(auth),
  ])

  const { errorCategoryId } = errorCategoryRow
  const countryTotalErrorCount = resultsByCategory.find(x => x.resultCategoryId === errorCategoryId)?.resultCount ?? 0
  const countryTotalResult = _.sumBy(resultsByCategory, x => x.resultCount)

  // Fill in placeholder rows for months that have no results in the period.
  // Iterate in local timezone so month labels match what the DB returned.
  const startLocal = utcToZonedTime(periodStart, timezoneIANA)
  let dt = nowLocal

  while (dt >= startLocal) {
    const monthTested = format(dt, 'yyyy-MM')

    if (!devicePerformance.find(x => x.monthTested === monthTested)) {
      const isCurrentMonth = format(nowLocal, 'yyyy-MM') === monthTested
      const placeholderLastDay = isCurrentMonth
        ? format(nowLocal, 'yyyy-MM-dd')
        : format(endOfMonth(new Date(`${monthTested}-01T00:00:00.000Z`)), 'yyyy-MM-dd')
      devicePerformance.push({
        errorCount: 0,
        totalResult: 0,
        monthTested,
        lastDayOfMonth: placeholderLastDay,
      })
    }

    dt = endOfMonth(subMonths(dt, 1))
  }

  let utilizationRateSum = 0

  const newData = devicePerformance.map(dp => {
    const minDate = `${dp.monthTested}-01`
    const lastDayForCalc = dp.lastDayOfMonth
    const workingDays = getWorkingDays(minDate, lastDayForCalc, customWorkingDaysConfig)
    dp.workingDays = workingDays

    if (!dp.dailyTestCapacity) {
      dp.utilizationRate = 0
    } else {
      const monthlyCapacity = Math.max(workingDays * dp.dailyTestCapacity, 1)
      dp.utilizationRate = Math.round(((dp.totalResult * 100) / monthlyCapacity) * 100) / 100
      if (dp.utilizationRate !== null && !Number.isNaN(dp.utilizationRate)) {
        utilizationRateSum += dp.utilizationRate
      }
    }

    if (dp.totalResult) {
      dp.errorRate = Math.round((dp.errorCount * 100) / dp.totalResult)
      return dp
    }
    dp.errorRate = 0
    return dp
  })

  const utilizationRateAvg = Math.round((utilizationRateSum / devicePerformance.length) * 100) / 100

  return {
    ok: true,
    length: newData.length,
    utilizationRateAvg,
    errorRateAvg: countryTotalResult > 0 ? Math.round((countryTotalErrorCount * 100) / countryTotalResult) : 0,
    data: _.sortBy(newData, [x => x.monthTested]),
  }
}

module.exports = { getDevicePerformance }
