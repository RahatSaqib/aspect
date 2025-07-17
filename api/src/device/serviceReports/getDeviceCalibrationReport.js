const { addYears } = require('date-fns')
const _ = require('lodash')
const { getDeviceBaseExtendedQuery } = require('../service')
const { getOffsetFromIsoDateString } = require('../../shared/date')
const { getSelectListFields } = require('../common/querySelectors')
const { getConstraints } = require('../../auth/constraints')
const { sortPageParams } = require('../../db')

async function getDeviceCalibrationReport(auth, query) {
  const dataConstraints = await getConstraints(auth.credentials)
  const deviceQuery = getDeviceBaseExtendedQuery(query, dataConstraints, { extendJoinToAssays: true })
  const userTimeOffset = getOffsetFromIsoDateString(query.maxDate)
  // get total count for paging
  const getCount = deviceQuery.clone().count('d.id as count').first()

  // get rows
  const getItems = deviceQuery
    .clone()
    .leftOuterJoin('DeviceMaintenance as dm', queryBuilder => {
      queryBuilder.on('d.id', 'dm.deviceId').andOn('dm.current', 1)
    })
    .modify(sortPageParams, query, 'name')
    .select([
      ..._.filter(getSelectListFields(userTimeOffset), elem => _.isString(elem) && elem.indexOf('dms.') !== 0),
      'd.serial',
      'dm.contextDate as calibratedOn',
    ])
    .groupBy(['d.id', 'd.serial'])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  // add more fields which depend on aggregations
  data.forEach(it => {
    it.nextCalibrationOn = it.calibratedOn ? addYears(it.calibratedOn, 1) : null
  })

  return { ok: true, total, length: data.length, data }
}

module.exports = { getDeviceCalibrationReport }
