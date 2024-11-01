module.exports = require('../../utils').seed(seed, __filename)

const sharedSeed = require('../shared/12_clean_&_describe_permissions')

async function seed(knex) {
  await sharedSeed(knex)
}
