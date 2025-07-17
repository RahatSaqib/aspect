const { getDeviceBaseExtendedQuery } = require('../service')
const { getConstraints } = require('../../auth/constraints')
const { knex, sortPageParams } = require('../../db')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../shared/date')

async function getDeviceCalibrationReport(auth, query, timezoneIANA) {
  const dataConstraints = await getConstraints(auth.credentials)
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true })
  // get total count for paging
  const getCount = deviceQuery.clone().count('d.id as count').first()

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftJoin('DeviceMaintenance as dm', queryBuilder => {
      queryBuilder.on('d.id', 'dm.deviceId').andOn('dm.current', 1)
    })
    .modify(sortPageParams, query, 'name')
    .select([
      'd.name',
      'd.serial',
      getDateTimeProjectionInTimeZoneIANA(knex, 'dm.contextDate', timezoneIANA, 'calibratedOn'),
      getDateTimeProjectionInTimeZoneIANA(
        knex,
        'DATE_ADD(dm.contextDate, INTERVAL 1 YEAR)',
        timezoneIANA,
        'nextCalibrationOn'
      ),
    ])
    .groupBy('d.id')

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

module.exports = { getDeviceCalibrationReport }
