module.exports = require('../../utils').seed(seed, __filename)

const { partnerName } = require('./fixtures/partnerVariables.json')

const sharedSeed = require('../shared/07_update_widgets')

async function seed(knex) {
  await sharedSeed(knex, partnerName)
}
