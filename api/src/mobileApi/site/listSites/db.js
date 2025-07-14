const { knex } = require('../../../db')
const { getSitesQuery } = require('../../../site/service')

const SELECT_LIST_FIELDS = [
  's.id',
  's.name',
  's.shortName',
  'sta.name as state',
  'l.name as lga',
  's.externalId',
  's.sampleRegistrationAllowed',
]

const getSitesMobileView = async (dataConstraints, type, sortBy = 'name') => {
  const userStatesIdsQuery = knex('State as st')
    .join('Geography as g', 'st.id', 'g.stateId')
    .join('JobContext as jc', 'g.id', 'jc.geographyId')
    .join('JobFunction as jf', 'jc.jobFunctionId', 'jf.id')
    .join('Person as p', 'jc.personId', 'p.id')
    .whereIn('st.externalId', type)
    .where('jf.partnerId', dataConstraints.partner.id)
    .select('g.stateId')

  // Query for sites the user has a Job Assignment to (onlyForTransfers = false)
  const assignedSitesQuery = getSitesQuery(dataConstraints).modify(qb => {
    if (type) {
      qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
    }
  })

  // Query for sites in user states, but not the ones with a Job Assignment (onlyForTransfers = true)
  const stateSitesQuery = knex('Site as s')
    .join('SiteType as st', 's.siteTypeId', 'st.id')
    .leftOuterJoin('Geography as g', 's.geographyId', 'g.id')
    .leftOuterJoin('State as sta', 'g.stateId', 'sta.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .modify(qb => {
      if (type) {
        qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
      }
    })
    .whereIn('g.stateId', userStatesIdsQuery)
    .whereNotIn('s.id', assignedSitesQuery.clone().select('s.id'))

  // Union the two queries
  const sitesListQ = assignedSitesQuery
    .clone()
    .select(SELECT_LIST_FIELDS)
    .select(knex.raw('false as onlyForTransfers'))
    .union(stateSitesQuery.select(SELECT_LIST_FIELDS).select(knex.raw('true as onlyForTransfers')))
    .orderBy(sortBy)
  // console.log('\x1b[1;36m', '🚀 ➜ getSitesMobileView ➜ q:', sitesListQ.toString())

  const sitesList = await sitesListQ
  sitesList.forEach(s => {
    s.sampleRegistrationAllowed = Boolean(s.sampleRegistrationAllowed)
    s.onlyForTransfers = Boolean(s.onlyForTransfers)
  })

  return sitesList
}

module.exports = { getSitesMobileView }
