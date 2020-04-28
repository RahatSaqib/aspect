module.exports = require('../utils').seed(seed, __filename)

const { clonePermissions } = require('../common')

async function seed(knex) {
  await clonePermissions(knex, 'result', 'case')
}
