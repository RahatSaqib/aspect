const { knex } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')

async function checkStateAccess(siteId, dataConstraints) {
  return knex('State as st')
    .where('st.id', siteId)
    .modify(addConstraints, dataConstraints, { state: 'st' })
    .first('st.id')
}

module.exports = {
  checkStateAccess,
}
