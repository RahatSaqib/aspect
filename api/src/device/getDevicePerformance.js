const { format, startOfMonth, subMonths, endOfMonth } = require('date-fns')
const _ = require('lodash')
const {
  getMonthYearExpressionFromFieldInTimeZone,
  getDateTimeExpressionInTimeZone,
  getTimezoneOffsetFromNumber,
  getWorkingDays,
} = require('../shared/date')
const { lastDayOfMonthByOffsetAndResultEndedOn } = require('../shared/query')
const { getConstraints, addConstraints, getUserFromCredentials } = require('../auth/constraints')
const { knex } = require('../db')

async function getDevicePerformance(request) {
  const { auth, params, query } = request
  const { deviceId } = params
  const dataConstraints = await getConstraints(auth.credentials)
  const user = await getUserFromCredentials(auth.credentials)
  const { timezoneIANA } = user

  const endedOn = new Date()
  const startedOn = startOfMonth(subMonths(endedOn, 12)) // 12 months period
  const offset = getTimezoneOffsetFromNumber(query.timezoneOffset)

  const devicePerformance = await knex('Result as r')
    .leftJoin('ResultCategory as rc1', 'rc1.id', 'r.resultCategory1')
    .innerJoin('Device as d', 'r.deviceId', 'd.id')
    .modify(
      addConstraints,
      dataConstraints,
      { result: 'r', device: 'd' },
      { showUnapprovedDevices: true, showDecommissionedDevices: true }
    )
    .where('r.deviceId', deviceId)
    .whereRaw(`DATE(${getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timezoneIANA)}) between date(?) and date(?)`, [
      startedOn,
      endedOn,
    ])
    .select([
      knex.raw('count(distinct r.id) as totalResult'), // group by r.endedOn as 'yyyy-MM'
      knex.raw(`sum(rc1.externalId = 'Error') as errorCount`),

      getMonthYearExpressionFromFieldInTimeZone(knex, 'r.endedOn', 'monthTested', timezoneIANA),
      lastDayOfMonthByOffsetAndResultEndedOn(knex, offset, 'lastDayOfMonth'),
      'd.dailyTestCapacity',
    ])
    .groupBy('monthTested')

  const { errorCategoryId } = await knex('ResultCategory as r')
    .where('r.externalId', 'Error')
    .first('r.id as errorCategoryId')

  const resultsByCategory = await knex('FactResultsDeviceByCategory1 as f')
    .innerJoin('Device as d', 'f.deviceId', 'd.id')
    .innerJoin('Assay as a', 'f.assayId', 'a.id')
    .modify(
      addConstraints,
      dataConstraints,
      { device: 'd', assay: 'a' },
      { showUnapprovedDevices: true, showDecommissionedDevices: true }
    )
    .where('f.days', 365)
    .groupBy('f.resultCategory1')
    .select([knex.raw('f.resultCategory1 as resultCategoryId'), knex.raw(`sum(f.resultCount) as resultCount`)])

  const countryTotalErrorCount = resultsByCategory.find(x => x.resultCategoryId === errorCategoryId)?.resultCount ?? 0
  const countryTotalResult = _.sumBy(resultsByCategory, x => x.resultCount)

  let dt = endedOn

  while (dt >= startedOn) {
    const monthTested = format(dt, 'yyyy-MM')

    if (!devicePerformance.find(x => x.monthTested === monthTested)) {
      devicePerformance.push({
        errorCount: 0,
        totalResult: 0,
        monthTested,
      })
    }

    dt = endOfMonth(subMonths(dt, 1))
  }

  let utilizationRateSum = 0

  const newData = devicePerformance.map(dp => {
    if (!dp.dailyTestCapacity) {
      dp.utilizationRate = 0
    } else {
      const minDate = new Date(`${dp.monthTested}-01`)
      const workingDays = getWorkingDays(minDate, dp.lastDayOfMonth)
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
    errorRateAvg: Math.round((countryTotalErrorCount * 100) / countryTotalResult),
    data: _.sortBy(newData, [x => x.monthTested]),
  }
}

module.exports = { getDevicePerformance }
