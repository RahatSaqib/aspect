const { knex } = require('../db')

function getPeopleBase() {
  return knex('Person as p')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .leftOuterJoin('State as st', 'g.stateId', 'st.id')
    .leftOuterJoin('Lga as l', 'g.lgaId', 'l.id')
    .leftJoin('JobContext as jc', 'jc.personId', 'p.id')
    .leftJoin('Site as s', 'jc.siteId', 's.id')
}

module.exports = {
  getPeopleBase,
}
