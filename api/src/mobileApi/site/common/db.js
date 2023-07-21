const { knex } = require('../../../db')

const getSitesInState = (partnerId, stateId, type) => {
  return knex('Site as s')
    .join('SiteType as st', 's.siteTypeId', 'st.id')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as sta', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('s.partnerId', partnerId)
    .modify(qb => {
      if (stateId) {
        qb.andWhere(stateIdQb => stateIdQb.whereNull('g.stateId').orWhere('g.stateId', stateId))
      }
      if (type) {
        qb.andWhere('st.externalId', type)
      }
    })
    .select('s.id', 's.name', 's.shortName', 'sta.name as state', 'l.name as lga', 's.externalId')
}

module.exports = { getSitesInState }
