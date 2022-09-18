const { knex } = require('../../../db')
const { getPeopleBase } = require('../../../shared/utilsPerson')
const { filterParams, filterDateRangeParams } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')
const { getOffsetFromIsoDateString, getDateTimeProjectionInUserTimeZone } = require('../../../shared/date')

module.exports = async function getUserActivityData(dataConstraints, params) {
  const offset = getOffsetFromIsoDateString(params.maxDate)

  const userActiviyQuery = getPeopleBase()
    .join('User as u', 'u.id', 'p.userId')
    .modify(filterDateRangeParams, params, 'u.lastLogin')
    .modify(addConstraints, dataConstraints, { state: 'st', lga: 'l', site: 's', geography: 'g' })
    .modify(filterParams, params, { siteName: 's.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
    .select('u.name as user', getDateTimeProjectionInUserTimeZone(knex, 'u.lastActive', offset, 'lastActive'))
    .orderBy('u.lastLogin', 'desc')

  return userActiviyQuery
}
