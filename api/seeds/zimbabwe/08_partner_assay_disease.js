module.exports = require('../utils').seed(seed, __filename)

const { seedPartnerAssay, seedPartnerDisease } = require('../utils')

async function seed(knex) {
  await seedPartnerAssay(knex)
  await seedPartnerDisease(knex)
}
