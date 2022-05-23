module.exports = require('../../utils').seed(seed, __filename)

const { partnerName } = require('./fixtures/partnerData')

const sharedSeed = require('../shared/10_update_widgets')

async function seed(knex) {
  await sharedSeed(knex, partnerName)
}
