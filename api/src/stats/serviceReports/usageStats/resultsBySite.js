const { knex, filterParams, filterDateRangeParams } = require('../../../db')
const { getBaseQuery } = require('../../../result/query')

module.exports = async function getResultsBySiteData(dataConstraints, params) {
  const userActiviyRows = getBaseQuery(knex, dataConstraints)
    .modify(filterParams, params, { siteName: 'si.name', stateId: 'g.stateId', lgaId: 'g.lgaId' })
    .modify(filterDateRangeParams, params, 'r.createdOn')
    .groupBy('r.siteId')
    .select('si.name as site')
    .count(`r.createdOn as testsReported`)
    .count(`r.endedOn as testsPerformed`)
    .orderBy('si.name')
  return userActiviyRows
}
