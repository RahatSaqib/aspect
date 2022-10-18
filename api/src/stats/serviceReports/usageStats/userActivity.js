const { knex } = require('../../../db')
const { getPeopleBase } = require('../../../shared/utilsPerson')
const { filterParams, filterDateRangeParams } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')
const { getOffsetFromIsoDateString, getDateTimeProjectionInUserTimeZone } = require('../../../shared/date')

module.exports = async function getUserActivityData(dataConstraints, params) {
  const offset = getOffsetFromIsoDateString(params.maxDate)

  const userActivityQuery = getPeopleBase()
    .join('User as u', 'u.id', 'p.userId')
    .join('LoginHistory as lh', 'u.id', 'lh.userId')
    .modify(filterDateRangeParams, params, 'lh.createdOn')
    .modify(addConstraints, dataConstraints, { state: 'st', lga: 'l', site: 's', geography: 'g' })
    .modify(filterParams, params, { siteName: 's.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
    .select('u.name as user', getDateTimeProjectionInUserTimeZone(knex, 'max(lh.createdOn)', offset, 'lastActive'))
    .groupBy('u.name')
    .orderBy('lastActive', 'desc')

  return userActivityQuery
}
