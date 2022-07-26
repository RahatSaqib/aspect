module.exports = require('../utils').seed(seed, __filename)

const seedSiteTypes = require('../common/20220712_site_type')

async function seed(knex) {
  await seedSiteTypes(knex)
}
