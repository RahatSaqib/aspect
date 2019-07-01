module.exports = require('../utils').seed(seed, 'myanmar_07_myanmar')
const { seedStockIssues } = require('../utils')

async function seed(knex) {
  await seedStockIssues(knex)
}
