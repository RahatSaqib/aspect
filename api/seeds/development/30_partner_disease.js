module.exports = require('../utils').seed(seed, __filename)

const { seedPartnerDisease } = require('../utils')

async function seed(knex) {
  await seedPartnerDisease(knex)
}
