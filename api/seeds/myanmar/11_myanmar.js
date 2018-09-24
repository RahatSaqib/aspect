module.exports = require('../utils').seed(seed)

const { seedStockIssuesUpdate } = require('../utils')

async function seed(knex) {
  await seedStockIssuesUpdate(knex, 'Myanmar')
}
