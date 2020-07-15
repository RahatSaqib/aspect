module.exports = require('../utils').seed(seed, __filename)
const { removeAndReplaceActivity } = require('../utils')

async function seed(knex) {
  await removeAndReplaceActivity(knex, 'admin', 'edit')
}
