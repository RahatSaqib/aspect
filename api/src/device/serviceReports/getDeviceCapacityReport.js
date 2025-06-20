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

  const countByDeviceAndPeriod = knex
    .select(
      'd.id',
      'd.name',
      'd.dailyTestCapacity',
      'result_group.count',
      knex.raw('date_format(result_group.period_first_day, "%Y-%m") as period'),
      knex.raw('GetWeekdaysInRangeCustom(last_day(result_group.period_first_day), result_group.period_first_day, p.customWorkingDays ->> "$.excludedDays") as workingDays')
    )
    .from(deviceQuery
      .groupBy('d.id', 'd.name', 'd.dailyTestCapacity', 'd.partnerId')
      .select('d.id', 'd.name', 'd.dailyTestCapacity', 'd.partnerId')
      .as('d'))
    .leftJoin('Partner as p', 'd.partnerId', 'p.id')
    .leftJoin(function () {
      this.select(
        'r.deviceId',
        'r.siteId',
        knex.raw('date_format(r.endedOn, "%Y-%m-01") as period_first_day'),
        knex.raw('count(*) as count')
      )
        .from('Result as r')
        .whereNotNull('r.endedOn')
        .andWhere('r.endedOn', '>=', minDate)
        .andWhere('r.endedOn', '<=', maxDate)
        .groupBy('r.deviceId', 'period_first_day')
        .as('result_group')
    }, 'result_group.deviceId', 'd.id')

  // Execute the query to get the raw data
  const rawData = await countByDeviceAndPeriod

  // Transform the data into the required format
  const data = rawData.reduce((acc, row) => {
    const deviceId = row.id
    const deviceName = row.name
    const period = row.period
    const count = row.count || 0
    const dailyTestCapacity = row.dailyTestCapacity || 0
    const workingDays = row.workingDays || 0

    // Calculate capacity percentage
    const capacityPercentage = workingDays > 0 && dailyTestCapacity > 0
      ? Number(((count * 100) / (dailyTestCapacity * workingDays)).toFixed(2))
      : null

    // Find existing device entry or create new one
    let deviceEntry = acc.find(device => device.id === deviceId)
    if (!deviceEntry) {
      deviceEntry = {
        name: deviceName,
        id: deviceId
      }
      acc.push(deviceEntry)
    }

    // Add the period data
    deviceEntry[period] = capacityPercentage

    return acc
  }, [])

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