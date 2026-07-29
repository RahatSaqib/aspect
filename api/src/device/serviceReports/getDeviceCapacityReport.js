const { addMonths } = require('date-fns')
const { getConstraints } = require('../../auth/constraints')
const { getPersonByPersonId } = require('../../auth/service')
const { getDeviceBaseExtendedQuery } = require('../service')
const { getDateTimeExpressionInTimeZone, getWorkingDays } = require('../../shared/date')
const { knex } = require('../../db')
const { getMonthsDatefields } = require('./logic')
const { getPartnerWorkingDaysConfig } = require('../../partner/common/db')

async function getDeviceCapacityReport(auth, query, timezone) {
  const dataConstraints = await getConstraints(auth.credentials)
  const { culture } = await getPersonByPersonId(auth.credentials.personId)
  let { minDate } = query
  const { maxDate } = query
  const timeZoneIANA = timezone

  minDate = minDate || addMonths(new Date(), -12).toISOString()

  // Get partner working days configuration
  const customWorkingDaysConfig = await getPartnerWorkingDaysConfig(auth)

  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true })

  const countByDeviceAndPeriodQuery = knex
    .select(
      'd.id',
      'd.name',
      'd.siteName',
      'd.dailyTestCapacity',
      'result_group.count',
      knex.raw('date_format(result_group.period_first_day, "%Y-%m") as period'),
      knex.raw('result_group.period_first_day as period_first_day')
    )
    .from(
      deviceQuery
        .groupBy('d.id', 'd.name', 's.name', 'd.dailyTestCapacity', 'd.partnerId')
        .select('d.id', 'd.name', 's.name as siteName', 'd.dailyTestCapacity', 'd.partnerId')
        .as('d')
    )
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .leftJoin(
      function () {
        this.select(
          'r.deviceId',
          'r.siteId',
          knex.raw(`date_format(CONVERT_TZ(r.endedOn, "+00:00", "${timeZoneIANA}"), "%Y-%m-01") as period_first_day`),
          knex.raw('count(*) as count')
        )
          .from('Result as r')
          .whereNotNull('r.endedOn')
          .andWhere(getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timeZoneIANA), '>=', minDate)
          .andWhere(getDateTimeExpressionInTimeZone(knex, 'r.endedOn', timeZoneIANA), '<=', maxDate)
          .groupBy('r.deviceId', 'period_first_day')
          .as('result_group')
      },
      'result_group.deviceId',
      'd.id'
    )
    .orderBy('d.name', 'asc')

  // Execute the query to get the raw data
  const rawData = await countByDeviceAndPeriodQuery

  // Transform the data into the required format
  const deviceMap = new Map()
  const workingDaysCache = {}

  for (const row of rawData) {
    const deviceId = row.id
    const deviceName = row.name
    const { period } = row
    const count = row.count || 0
    const dailyTestCapacity = row.dailyTestCapacity || 0
    const periodFirstDay = row.period_first_day

    // Calculate working days for this period using cached result
    let workingDays = 0
    if (periodFirstDay) {
      if (!workingDaysCache[periodFirstDay]) {
        const periodStart = new Date(periodFirstDay)
        const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0) // Last day of the month
        workingDaysCache[periodFirstDay] = getWorkingDays(
          periodStart.toISOString(),
          periodEnd.toISOString(),
          customWorkingDaysConfig
        )
      }
      workingDays = workingDaysCache[periodFirstDay]
    }

    // Calculate capacity percentage
    const capacityPercentage =
      workingDays > 0 && dailyTestCapacity > 0
        ? Number(((count * 100) / (dailyTestCapacity * workingDays)).toFixed(2))
        : null

    // Get or create device entry using Map for O(1) lookup
    let deviceEntry = deviceMap.get(deviceId)
    if (!deviceEntry) {
      deviceEntry = {
        id: deviceId,
        name: deviceName,
        siteName: row.siteName,
        dailyTestCapacity,
      }
      deviceMap.set(deviceId, deviceEntry)
    }

    // Add the period data
    deviceEntry[period] = capacityPercentage
  }

  // Convert Map values back to array
  const data = Array.from(deviceMap.values())

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
