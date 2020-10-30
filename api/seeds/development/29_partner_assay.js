module.exports = require('../utils').seed(seed, __filename)

const { seedPartnerAssay } = require('../utils')

async function seed(knex) {
  await seedPartnerAssay(knex)
}
