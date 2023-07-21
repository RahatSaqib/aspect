const { knex } = require('../../../db')

const getSitesInState = (partnerId, stateId) => {
  return knex('Site as s')
    .leftJoin('Geography as g', 's.geographyId', 'g.id')
    .leftJoin('State as st', 'g.stateId', 'st.id')
    .leftJoin('Lga as l', 'g.lgaId', 'l.id')
    .where('s.partnerId', partnerId)
    .modify(qb => {
      if (stateId) {
        qb.andWhere(stateIdQb => stateIdQb.whereNull('g.stateId').orWhere('g.stateId', stateId))
      }
    })
    .select('s.id', 's.name', 's.shortName', 'st.name as state', 'l.name as lga', 's.externalId')
}

module.exports = { getSitesInState }
