const { knex } = require('../db')
const { getConstraints } = require('../auth/constraints')
const { getSiteListQuery, getSiteListModifiedQuery } = require('./common/db')

async function listSites(request) {
  const { query, auth } = request

  // To ensure correct database queries, the `stateId` and `lgaId` values should be converted from empty strings to `null`.
  ;['stateId', 'lgaId'].forEach(property => {
    if (query[property] === '') {
      query[property] = null
    }
  })

  // get data constraints
  const dataConstraints = await getConstraints(auth.credentials)

  const siteQuery = getSiteListQuery(query, dataConstraints)

  const getCount = knex
    .count('siteId as count')
    .from(siteQuery.clone().select('s.id as siteId').distinct().as('innerQuery'))
    .first()
  // get rows
  const getItems = getSiteListModifiedQuery(query, dataConstraints)

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])
  const result = { ok: true, total, length: data.length, data }
  return result
}

module.exports = { listSites }
