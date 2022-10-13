const { knex, filterParams, filterDateRangeParams } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')
const { getBaseQuery } = require('../../../result/query')
const { getPeopleBase } = require('../../../shared/utilsPerson')

module.exports = async function getUsageStatsData(dataConstraints, query) {
  const activeUsersPromise = getActiveUsers(dataConstraints, query)
  const smsSentPromise = getSmsSent(dataConstraints, query)
  const emailsSentPromise = getEmailsSent(dataConstraints, query)
  const devicesReportingPromise = getDevicesReporting(dataConstraints, query)
  const totalsPromise = getTestsTotals(dataConstraints, query)

  const [activeUsers, smsSent, emailsSent, devicesReporting, { testsReported, testsPerformed }] = await Promise.all([
    activeUsersPromise,
    smsSentPromise,
    emailsSentPromise,
    devicesReportingPromise,
    totalsPromise,
  ])

  return { activeUsers, smsSent, emailsSent, devicesReporting, testsReported, testsPerformed }
}

async function getActiveUsers(dataConstraints, params) {
  const { count } = await getPeopleBase()
    .join('User as u', 'u.id', 'p.userId')
    .join('LoginHistory as lh', 'u.id', 'lh.userId')
    .modify(filterDateRangeParams, params, 'lh.createdOn')
    .modify(addConstraints, dataConstraints, { state: 'st', lga: 'l', site: 's', geography: 'g' })
    .modify(filterParams, params, { siteName: 's.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
    .where('lh.success', 1)
    .select(knex.raw('count(distinct(u.id)) as count'))
    .first()

  return count
}

async function getSmsSent(dataConstraints, params) {
  const { count } = await knex('SmsMessage as m')
    .leftJoin('Site as s', 's.id', 'm.siteId')
    .leftJoin('Device as d', 'd.id', 'm.deviceId')
    .leftJoin('Geography as g', 'g.id', 's.geographyId')
    .modify(addConstraints, dataConstraints, { site: 's', device: 'd', geography: 'g' })
    .modify(filterParams, params, { siteName: 's.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
    .modify(filterDateRangeParams, params, 'm.createdOn')
    .count('* as count')
    .first()

  return count
}

async function getEmailsSent(dataConstraints, params) {
  const { count } = await knex('EmailMessage as m')
    .leftJoin('Site as s', 's.id', 'm.siteId')
    .leftJoin('Device as d', 'd.id', 'm.deviceId')
    .leftJoin('Geography as g', 'g.id', 's.geographyId')
    .modify(addConstraints, dataConstraints, { site: 's', device: 'd', geography: 'g' })
    .modify(filterParams, params, { siteName: 's.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
    .modify(filterDateRangeParams, params, 'm.createdOn')
    .count('* as count')
    .first()
  return count
}

async function getDevicesReporting(dataConstraints, params) {
  const { count } = await knex(
    knex('Device as d')
      .leftJoin('Result as r', 'd.id', 'r.deviceId')
      .leftJoin('Site as s', 's.id', 'd.siteId')
      .leftJoin('Geography as g', 'g.id', 's.geographyId')
      .modify(filterDateRangeParams, params, 'r.createdOn')
      .modify(addConstraints, dataConstraints, { site: 's', device: 'd', geography: 'g' })
      .modify(filterParams, params, { siteName: 's.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
      .groupBy('d.id')
      .having(knex.raw('count(r.id) > 0'))
      .select('d.id')
      .as('b')
  )
    .count('* as count')
    .first()

  return count
}

async function getTestsTotals(dataConstraints, params) {
  const totalsQuery = getBaseQuery(knex, dataConstraints)
    .modify(filterParams, params, { siteName: 'si.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
    .modify(filterDateRangeParams, params, 'r.createdOn')
    .count(`r.createdOn as testsReported`)
    .count(`r.endedOn as testsPerformed`)
    .first()
  return totalsQuery
}
