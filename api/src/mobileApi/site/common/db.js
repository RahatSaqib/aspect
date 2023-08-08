const { knex } = require('../../../db')
const { getSitesQuery } = require('../../../site/service')

const SELECT_LIST_FIELDS = ['s.id', 's.name', 's.shortName', 'st.name as state', 'l.name as lga', 's.externalId']

const getSitesInState = (partnerId, stateId, type) => {
  return knex('Site as s')
    .join('SiteType as st', 's.siteTypeId', 'st.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as sta', 'g.stateId', 'sta.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('s.partnerId', partnerId)
    .modify(qb => {
      if (stateId) {
        qb.andWhere('g.stateId', stateId)
      }
      if (type) {
        qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
      }
    })
    .select(SELECT_LIST_FIELDS)
}

const getUserSites = (dataConstraints, type) => {
  const userSitesQuery = getSitesQuery(dataConstraints)
  return userSitesQuery
    .clone()
    .modify(qb => {
      if (type) {
        qb.andWhere(qbSiteType => qbSiteType.whereIn('st.externalId', type))
      }
    })
    .select(SELECT_LIST_FIELDS)
}

module.exports = { getSitesInState, getUserSites }
