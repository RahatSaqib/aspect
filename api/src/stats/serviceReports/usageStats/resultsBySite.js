const { addConstraints } = require('../../../auth/constraints')
const { knex, filterParams, filterDateRangeParams } = require('../../../db')
const { getBaseQuery } = require('../../../result/query')

module.exports = async function getResultsBySiteData(dataConstraints, params) {
  const userActiviyRows = knex('Site as baseSite')
    .join('Geography as geo', 'baseSite.geographyId', 'geo.id')
    .modify(addConstraints, dataConstraints, {
      site: 'baseSite',
      geography: 'geo',
    })
    .leftJoin(
      getBaseQuery(knex, dataConstraints)
        .select('si.id as siteId', 'r.createdOn as createdOn', 'r.endedOn as endedOn')
        .as('results'),
      'results.siteId',
      'baseSite.id'
    )
    .modify(filterParams, params, { siteName: 'baseSite.name', stateId: 'geo.stateId', lgaId: 'geo.lgaId' })
    .modify(filterDateRangeParams, params, 'results.createdOn')
    .groupBy('results.siteId', 'baseSite.name')
    .select('baseSite.name as site')
    .count(`results.createdOn as testsReported`)
    .count(`results.endedOn as testsPerformed`)
    .orderBy('baseSite.name')
  return userActiviyRows
}
