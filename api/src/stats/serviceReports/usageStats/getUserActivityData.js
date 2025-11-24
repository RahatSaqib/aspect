const { knex } = require('../../../db')
const { getPeopleBase } = require('../../../shared/utilsPerson')
const { filterParams, filterDateRangeParams } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')
const { getDateTimeProjectionInTimeZoneIANA } = require('../../../shared/date')

async function getUserActivityData(dataConstraints, params, timezoneIANA) {
  const userActivityQuery = getPeopleBase()
    .join('User as u', 'u.id', 'p.userId')
    .join('LoginHistory as lh', 'u.id', 'lh.userId')
    .leftOuterJoin('UserPageViews as upv', 'p.id', 'upv.personId')
    .modify(filterDateRangeParams, params, 'lh.createdOn')
    .modify(addConstraints, dataConstraints, { state: 'st', lga: 'l', site: 's', geography: 'g' })
    .modify(filterParams, params, { siteName: 's.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
    .select(
      'u.name as user',
      getDateTimeProjectionInTimeZoneIANA(knex, 'max(lh.createdOn)', timezoneIANA, 'lastActive'),
      knex.raw('coalesce(upv.count, 0) as pageView')
    )
    .groupBy('u.name')
    .orderBy('lastActive', 'desc')

  return userActivityQuery
}

module.exports = {
  getUserActivityData,
}
