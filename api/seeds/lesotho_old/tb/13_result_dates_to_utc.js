module.exports = require('../../utils').seed(seed, __filename)

const sharedSeed = require('../shared/13_result_dates_to_utc')

async function seed(knex) {
  await sharedSeed(knex)
}
