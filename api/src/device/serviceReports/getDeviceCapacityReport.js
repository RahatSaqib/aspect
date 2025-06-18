const _ = require('lodash')
const { addMonths } = require('date-fns')
const { getConstraints } = require('../../auth/constraints')
const { getPersonByPersonId } = require('../../auth/service')
const { getDeviceBaseExtendedQuery } = require('../service')
const { getMonthYearExpressionFromFieldInTimeZone } = require('../../shared/date')
const { knex } = require('../../db')
const { getMonthsDatefields } = require('./index')

async function getDeviceCapacityReport(auth, query, timezone) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getPersonByPersonId(auth.credentials.personId)
  let { minDate } = query
  const { maxDate } = query
  const timeZoneIANA = timezone

  minDate = minDate || addMonths(new Date(), -12).toISOString()

  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true })

  // Precompute working days for each period using timeZoneIANA
  const workingDaysQuery = deviceQuery
    .clone()
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .select(
      'd.id AS deviceId',
      getMonthYearExpressionFromFieldInTimeZone(knex, 'r.endedOn', 'monthYear', timeZoneIANA),
      knex.raw(
        `GetWeekdaysInRangeCustom(
          LAST_DAY(DATE_FORMAT(r.endedOn, '%Y-%m-01')),
          DATE_FORMAT(r.endedOn, '%Y-%m-01'),
          p.customWorkingDays->>"$.excludedDays"
        ) as workingDays`
      )
    )
    .groupBy('d.id', 'monthYear')

  const monthlyCapacityQuery = deviceQuery
    .clone()
    .leftJoin('Result as r', builder =>
      builder.on('d.id', 'r.deviceId').andOn(knex.raw('DATE(r.endedOn) BETWEEN ? AND ?', [minDate, maxDate]))
    )
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .leftJoin({ wd: workingDaysQuery }, function () {
      this.on('d.id', 'wd.deviceId').andOn(
        knex.raw('wd.monthYear = ?', [
          getMonthYearExpressionFromFieldInTimeZone(knex, 'r.endedOn', 'monthYear', timeZoneIANA),
        ])
      )
    })
    .where({ 'dt.externalId': 'CepheidGeneXpert' })
    .andWhere(knex.raw(`find_in_set(DAYOFWEEK(r.endedOn), COALESCE(p.customWorkingDays->>"$.excludedDays", '')) = 0`))
    .groupBy('d.id', 'monthYear')
    .distinct(
      'd.name',
      'wd.monthYear',
      'd.id AS deviceId',
      knex.raw('COUNT(DISTINCT r.id) as resultCount'),
      'wd.workingDays',
      'd.dailyTestCapacity as dailyCapacity')
    .orderBy('d.name')

  const devicePeriodsQuery = deviceQuery
    .clone()
    .whereNotIn('dt.externalId', ['GxAlert', 'Aspect'])
    .groupBy('d.id')
    .select('d.name', 'd.id')
    .orderBy('d.name')

  console.log('\x1b[1;36m', '🚀 ➜ monthlyCapacityQuery:', monthlyCapacityQuery.toString())
  const [monthlyCapacityData, devicePeriods] = await Promise.all([monthlyCapacityQuery, devicePeriodsQuery])

  const data = devicePeriods.map(devicePeriods => {
    monthlyCapacityData
      .filter(deviceFiltered => deviceFiltered.deviceId === devicePeriods.id)
      .forEach(filteredMonthlyCapacity => {
        devicePeriods[filteredMonthlyCapacity.monthYear] = Math.round(
          (filteredMonthlyCapacity.resultCount * 100) /
          Math.max(filteredMonthlyCapacity.dailyCapacity * filteredMonthlyCapacity.workingDays, 1)
        )
      })

    return devicePeriods
  })

  const dataset = {
    ok: true,
    total: data.length,
    length: data.length,
    data,
    dynamicColumns: getMonthsDatefields(minDate, maxDate, culture),
  }
  return dataset
}

module.exports = { getDeviceCapacityReport }
