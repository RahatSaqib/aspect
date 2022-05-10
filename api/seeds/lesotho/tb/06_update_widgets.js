module.exports = require('../../utils').seed(seed, __filename)

const { partnerName } = require('./fixtures/partnerData')

const sharedSeed = require('../shared/06_update_widgets')

async function seed(knex) {
  await sharedSeed(knex, partnerName)
}
