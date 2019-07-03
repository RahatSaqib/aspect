module.exports = require('../utils').seed(seed, __filename, true)

const { seedStockIssues } = require('../utils')

async function seed(knex) {
  await seedStockIssues(knex)
}
